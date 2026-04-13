from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.transaction import Transaction, TransactionType
from app.models.budget import Budget
import requests
import base64
import os
from datetime import datetime

mpesa_bp = Blueprint('mpesa', __name__)

def get_mpesa_token():
    consumer_key = os.getenv('MPESA_CONSUMER_KEY')
    consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
    env = os.getenv('MPESA_ENV', 'sandbox')

    if env == 'sandbox':
        url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    else:
        url = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'

    credentials = base64.b64encode(f'{consumer_key}:{consumer_secret}'.encode()).decode()

    response = requests.get(
        url,
        headers={'Authorization': f'Basic {credentials}'}
    )

    return response.json().get('access_token')


def generate_password():
    shortcode = os.getenv('MPESA_SHORTCODE')
    passkey = os.getenv('MPESA_PASSKEY')
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    raw = f'{shortcode}{passkey}{timestamp}'
    password = base64.b64encode(raw.encode()).decode()
    return password, timestamp


@mpesa_bp.route('/stk-push', methods=['POST'])
@jwt_required()
def stk_push():
    user_id = get_jwt_identity()
    data = request.get_json()

    phone = data.get('phone')
    amount = data.get('amount')
    account_ref = data.get('account_ref', 'FlowWise')
    description = data.get('description', 'Payment')

    if not phone or not amount:
        return jsonify({'error': 'Phone number and amount are required'}), 400

    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif phone.startswith('+'):
        phone = phone[1:]

    try:
        token = get_mpesa_token()
        password, timestamp = generate_password()
        env = os.getenv('MPESA_ENV', 'sandbox')

        if env == 'sandbox':
            url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
        else:
            url = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

        payload = {
            'BusinessShortCode': os.getenv('MPESA_SHORTCODE'),
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(amount),
            'PartyA': phone,
            'PartyB': os.getenv('MPESA_SHORTCODE'),
            'PhoneNumber': phone,
            'CallBackURL': os.getenv('MPESA_CALLBACK_URL'),
            'AccountReference': account_ref,
            'TransactionDesc': description
        }

        response = requests.post(
            url,
            json=payload,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
        )

        result = response.json()
        print(f'STK Push response: {result}')

        if result.get('ResponseCode') == '0':
            return jsonify({
                'message': 'Payment request sent to your phone',
                'checkout_request_id': result.get('CheckoutRequestID')
            }), 200
        else:
            return jsonify({
                'error': result.get('errorMessage', 'Payment request failed')
            }), 400

    except Exception as e:
        print(f'STK Push error: {e}')
        return jsonify({'error': 'Failed to initiate payment'}), 500


@mpesa_bp.route('/callback', methods=['POST'])
def mpesa_callback():
    data = request.get_json()
    print(f'M-Pesa callback received: {data}')

    try:
        body = data.get('Body', {})
        stk_callback = body.get('stkCallback', {})
        result_code = stk_callback.get('ResultCode')

        if result_code != 0:
            print(f'Payment failed with code: {result_code}')
            return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'}), 200

        metadata = stk_callback.get('CallbackMetadata', {})
        items = metadata.get('Item', [])

        amount = None
        phone = None
        mpesa_receipt = None
        transaction_date = None

        for item in items:
            name = item.get('Name')
            value = item.get('Value')
            if name == 'Amount':
                amount = value
            elif name == 'MpesaReceiptNumber':
                mpesa_receipt = value
            elif name == 'PhoneNumber':
                phone = str(value)
            elif name == 'TransactionDate':
                transaction_date = str(value)

        print(f'Payment received: KES {amount} from {phone}, receipt: {mpesa_receipt}')

        return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'}), 200

    except Exception as e:
        print(f'Callback processing error: {e}')
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'}), 200


@mpesa_bp.route('/simulate', methods=['POST'])
@jwt_required()
def simulate_payment():
    user_id = get_jwt_identity()
    data = request.get_json()

    phone = data.get('phone', '254700000000')
    amount = data.get('amount')
    category = data.get('category', 'M-Pesa')
    description = data.get('description', '')

    if not amount:
        return jsonify({'error': 'Amount is required'}), 400

    transaction = Transaction(
        user_id=user_id,
        type=TransactionType.expense,
        category=category,
        amount=amount,
        date=datetime.utcnow().date(),
        notes=f'M-Pesa payment from {phone}. {description}'.strip()
    )

    db.session.add(transaction)

    budget = Budget.query.filter_by(
        user_id=user_id,
        category=category
    ).first()
    if budget:
        budget.spent_amount = float(budget.spent_amount) + float(amount)

    db.session.commit()

    return jsonify({
        'message': 'M-Pesa transaction recorded successfully',
        'transaction_id': transaction.id
    }), 201