from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.transaction import Transaction, TransactionType
from app.models.budget import Budget
from app.models.mpesa_account import MpesaAccount
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

    credentials = base64.b64encode(
        f'{consumer_key}:{consumer_secret}'.encode()
    ).decode()

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


def record_transaction(user_id, amount, phone, notes, category='M-Pesa',
                       transaction_type=TransactionType.income):
    transaction = Transaction(
        user_id=user_id,
        type=transaction_type,
        category=category,
        amount=amount,
        date=datetime.utcnow().date(),
        notes=notes
    )
    db.session.add(transaction)

    if transaction_type == TransactionType.expense:
        budget = Budget.query.filter_by(
            user_id=user_id,
            category=category
        ).first()
        if budget:
            budget.spent_amount = float(budget.spent_amount) + float(amount)

    db.session.commit()
    return transaction


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
                'message': 'Payment request sent to phone',
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
    print(f'STK callback received: {data}')

    try:
        body = data.get('Body', {})
        stk_callback = body.get('stkCallback', {})
        result_code = stk_callback.get('ResultCode')

        if result_code != 0:
            print(f'Payment failed: {result_code}')
            return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'}), 200

        metadata = stk_callback.get('CallbackMetadata', {})
        items = metadata.get('Item', [])

        amount = None
        phone = None
        mpesa_receipt = None

        for item in items:
            name = item.get('Name')
            value = item.get('Value')
            if name == 'Amount':
                amount = value
            elif name == 'MpesaReceiptNumber':
                mpesa_receipt = value
            elif name == 'PhoneNumber':
                phone = str(value)

        print(f'STK payment: KES {amount} from {phone}, receipt: {mpesa_receipt}')
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'}), 200

    except Exception as e:
        print(f'STK callback error: {e}')
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
    transaction_type = data.get('type', 'expense')

    if not amount:
        return jsonify({'error': 'Amount is required'}), 400

    t_type = TransactionType.income if transaction_type == 'income' else TransactionType.expense
    notes = f'M-Pesa from {phone}. {description}'.strip()

    transaction = record_transaction(user_id, amount, phone, notes, category, t_type)

    return jsonify({
        'message': 'M-Pesa transaction recorded successfully',
        'transaction_id': transaction.id
    }), 201


@mpesa_bp.route('/accounts', methods=['GET'])
@jwt_required()
def get_accounts():
    user_id = get_jwt_identity()
    accounts = MpesaAccount.query.filter_by(user_id=user_id).all()
    return jsonify([a.to_dict() for a in accounts]), 200


@mpesa_bp.route('/accounts', methods=['POST'])
@jwt_required()
def add_account():
    user_id = get_jwt_identity()
    data = request.get_json()

    account_type = data.get('account_type')
    shortcode = data.get('shortcode')
    account_name = data.get('account_name')

    if not account_type or not shortcode or not account_name:
        return jsonify({'error': 'Account type, shortcode and name are required'}), 400

    if account_type not in ['till', 'paybill']:
        return jsonify({'error': 'Account type must be till or paybill'}), 400

    existing = MpesaAccount.query.filter_by(
        user_id=user_id,
        shortcode=shortcode
    ).first()
    if existing:
        return jsonify({'error': 'This shortcode is already registered'}), 409

    account = MpesaAccount(
        user_id=user_id,
        account_type=account_type,
        shortcode=shortcode,
        account_name=account_name
    )
    db.session.add(account)
    db.session.commit()

    try:
        token = get_mpesa_token()
        env = os.getenv('MPESA_ENV', 'sandbox')
        base_callback = os.getenv('MPESA_CALLBACK_URL', '').replace('/callback', '')

        if env == 'sandbox':
            url = 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl'
        else:
            url = 'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl'

        payload = {
            'ShortCode': shortcode,
            'ResponseType': 'Completed',
            'ConfirmationURL': f'{base_callback}/c2b-confirmation',
            'ValidationURL': f'{base_callback}/c2b-validation'
        }

        response = requests.post(
            url,
            json=payload,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
        )
        print(f'Register URL response: {response.json()}')

    except Exception as e:
        print(f'Register URL error (account saved anyway): {e}')

    return jsonify({
        'message': f'{account_type.title()} number registered successfully',
        'account': account.to_dict()
    }), 201


@mpesa_bp.route('/accounts/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_account(id):
    user_id = get_jwt_identity()
    account = MpesaAccount.query.filter_by(id=id, user_id=user_id).first()

    if not account:
        return jsonify({'error': 'Account not found'}), 404

    db.session.delete(account)
    db.session.commit()
    return jsonify({'message': 'Account removed'}), 200


@mpesa_bp.route('/c2b-validation', methods=['POST'])
def c2b_validation():
    data = request.get_json()
    print(f'C2B Validation: {data}')
    return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'}), 200


@mpesa_bp.route('/c2b-confirmation', methods=['POST'])
def c2b_confirmation():
    data = request.get_json()
    print(f'C2B Confirmation: {data}')

    try:
        amount = data.get('TransAmount')
        trans_id = data.get('TransID')
        msisdn = data.get('MSISDN')
        bill_ref = data.get('BillRefNumber', '')
        first_name = data.get('FirstName', '')
        shortcode = data.get('BusinessShortCode')

        account = MpesaAccount.query.filter_by(
            shortcode=str(shortcode),
            is_active=True
        ).first()

        if account:
            notes = f'M-Pesa C2B from {msisdn} ({first_name}). Ref: {bill_ref}. Receipt: {trans_id}'
            record_transaction(
                user_id=account.user_id,
                amount=float(amount),
                phone=msisdn,
                notes=notes,
                category='Sales',
                transaction_type=TransactionType.income
            )
            print(f'C2B income recorded: KES {amount} from {msisdn}')
        else:
            print(f'No account found for shortcode {shortcode}')

        return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'}), 200

    except Exception as e:
        print(f'C2B confirmation error: {e}')
        return jsonify({'ResultCode': 0, 'ResultDesc': 'Accepted'}), 200