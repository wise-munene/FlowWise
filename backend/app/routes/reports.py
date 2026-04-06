from flask import Blueprint, request, jsonify, send_file
from app import db
from app.models.transaction import Transaction, TransactionType
from flask_jwt_extended import jwt_required, get_jwt_identity
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import csv
import io
from datetime import datetime

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/csv', methods=['GET'])  #csv report generation endpoint that allows users to download their transaction history as a CSV file, with optional date range filtering
@jwt_required()
def download_csv():
    user_id = get_jwt_identity()

    start_date = request.args.get('start_date') # optional parameters to  get  reports for different timelines
    end_date = request.args.get('end_date')

    query = Transaction.query.filter_by(user_id=user_id)

    if start_date:
        query = query.filter(Transaction.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Transaction.date <= datetime.strptime(end_date, '%Y-%m-%d').date())

    transactions = query.order_by(Transaction.date.desc()).all()

    buffer = io.StringIO()  # Create an in-memory file to store data
    writer = csv.writer(buffer)  #  fromats the data as CSV and writes it to the buffer

    writer.writerow(['Date', 'Type', 'Category', 'Amount', 'Notes', 'Recurring'])

    for t in transactions:
        writer.writerow([  #Write each transaction's date, type, category, amount, notes and whether it's recurring to the CSV file
            t.date.strftime('%Y-%m-%d'),
            t.type.value,
            t.category,
            float(t.amount),
            t.notes or '',
            'Yes' if t.is_recurring else 'No'
        ])

    buffer.seek(0)  # reset the buffer's position to the beginning so it can be read from the start when sending the file to the user
    return send_file(
        io.BytesIO(buffer.getvalue().encode()), # Convert the string buffer to bytes and send it as a file response with the appropriate headers for CSV download
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'flowwise_report_{datetime.now().strftime("%Y%m%d")}.csv'
    )


@reports_bp.route('/pdf', methods=['GET'])
@jwt_required()
def download_pdf():
    user_id = get_jwt_identity()

    start_date = request.args.get('start_date') 
    end_date = request.args.get('end_date')

    query = Transaction.query.filter_by(user_id=user_id)

    if start_date:
        query = query.filter(Transaction.date >= datetime.strptime(start_date, '%Y-%m-%d').date())  # Filter transactions based on the provided start and end dates, allowing users to generate reports for specific time periods
    if end_date:
        query = query.filter(Transaction.date <= datetime.strptime(end_date, '%Y-%m-%d').date())

    transactions = query.order_by(Transaction.date.desc()).all()

    total_income = sum(float(t.amount) for t in transactions if t.type == TransactionType.income)
    total_expense = sum(float(t.amount) for t in transactions if t.type == TransactionType.expense)
    net = total_income - total_expense

    buffer = io.BytesIO()  # Create an in-memory bytes buffer to store the PDF data as it's generated, allowing us to send it as a file response without saving it to disk
    doc = SimpleDocTemplate(buffer, pagesize=A4) # Set up the PDF document with the in-memory buffer and A4 page size, preparing it for content generation
    styles = getSampleStyleSheet() #  sample styles for the pdf
    elements = []
 
    elements.append(Paragraph('FlowWise Financial Report', styles['Title']))
    elements.append(Spacer(1, 12)) 
    elements.append(Paragraph(
        f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}',
        styles['Normal'] 
    ))
    elements.append(Spacer(1, 12))  #12 inch space between elements

    summary_data = [
        ['Total Income', 'Total Expenses', 'Net Balance'],
        [f'KES {total_income:,.2f}', f'KES {total_expense:,.2f}', f'KES {net:,.2f}']
    ]
    summary_table = Table(summary_data, colWidths=[160, 160, 160])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a56db')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#f9fafb')),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph('Transaction Details', styles['Heading2']))
    elements.append(Spacer(1, 8))

    table_data = [['Date', 'Type', 'Category', 'Amount', 'Notes']]
    for t in transactions:
        table_data.append([
            t.date.strftime('%Y-%m-%d'),
            t.type.value,
            t.category,
            f'KES {float(t.amount):,.2f}',
            t.notes or ''
        ])

    transaction_table = Table(table_data, colWidths=[80, 60, 100, 100, 140])
    transaction_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a56db')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(transaction_table)

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'flowwise_report_{datetime.now().strftime("%Y%m%d")}.pdf'
    )