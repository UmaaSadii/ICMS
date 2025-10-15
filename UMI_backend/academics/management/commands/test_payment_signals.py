from django.core.management.base import BaseCommand
from academics.models import Fee, Payment
from students.models import Student
from decimal import Decimal

class Command(BaseCommand):
    help = 'Test payment creation and signal functionality'

    def handle(self, *args, **options):
        self.stdout.write('Testing payment creation and signal functionality...')

        # Get a fee record
        try:
            fee = Fee.objects.first()
            if not fee:
                self.stdout.write(self.style.ERROR('No fee records found. Please create some fee records first.'))
                return

            self.stdout.write(f'Found fee: {fee.fee_id} for student {fee.student.student_id}')
            self.stdout.write(f'Initial paid_amount: {fee.paid_amount}')
            self.stdout.write(f'Initial balance: {fee.balance}')
            self.stdout.write(f'Initial status: {fee.status}')

            # Create a payment
            payment = Payment.objects.create(
                fee=fee,
                amount=Decimal('100.00'),
                payment_method='Cash',
                notes='Test payment from management command'
            )

            self.stdout.write(f'Created payment: {payment.payment_id} for amount {payment.amount}')

            # Refresh the fee from database to see if signals updated it
            fee.refresh_from_db()

            self.stdout.write(f'After payment - paid_amount: {fee.paid_amount}')
            self.stdout.write(f'After payment - balance: {fee.balance}')
            self.stdout.write(f'After payment - status: {fee.status}')

            # Verify the calculation
            total_payments = fee.payments.aggregate(total=Payment.objects.filter(fee=fee).aggregate(total=Decimal('0.00'))['total'] or Decimal('0.00'))['total'] or Decimal('0.00')
            expected_paid_amount = total_payments
            expected_balance = fee.amount - expected_paid_amount

            if fee.paid_amount == expected_paid_amount:
                self.stdout.write(self.style.SUCCESS(f'✓ paid_amount correctly updated to {fee.paid_amount}'))
            else:
                self.stdout.write(self.style.ERROR(f'✗ paid_amount mismatch: expected {expected_paid_amount}, got {fee.paid_amount}'))

            if fee.balance == expected_balance:
                self.stdout.write(self.style.SUCCESS(f'✓ balance correctly updated to {fee.balance}'))
            else:
                self.stdout.write(self.style.ERROR(f'✗ balance mismatch: expected {expected_balance}, got {fee.balance}'))

            # Test multiple payments
            self.stdout.write('\nTesting multiple payments...')
            payment2 = Payment.objects.create(
                fee=fee,
                amount=Decimal('50.00'),
                payment_method='Card',
                notes='Second test payment'
            )

            fee.refresh_from_db()
            self.stdout.write(f'After second payment - paid_amount: {fee.paid_amount}')
            self.stdout.write(f'After second payment - balance: {fee.balance}')
            self.stdout.write(f'After second payment - status: {fee.status}')

            # Test payment deletion
            self.stdout.write('\nTesting payment deletion...')
            payment2.delete()

            fee.refresh_from_db()
            self.stdout.write(f'After payment deletion - paid_amount: {fee.paid_amount}')
            self.stdout.write(f'After payment deletion - balance: {fee.balance}')
            self.stdout.write(f'After payment deletion - status: {fee.status}')

            self.stdout.write(self.style.SUCCESS('Payment signal testing completed!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during testing: {e}'))
            import traceback
            traceback.print_exc()
