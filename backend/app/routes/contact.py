from flask import Blueprint, request, jsonify
from flask_mail import Message
from app import mail

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/contact', methods=['POST'])
def send_contact():
    data = request.get_json()

    try:
        msg = Message(
            subject=f"New message from {data.get('name')}",
            sender=data.get('email'),
            recipients=["your@email.com"],  # change this
            body=data.get('message')
        )

        mail.send(msg)

        return jsonify({"message": "Email sent successfully"}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": "Failed to send email"}), 500