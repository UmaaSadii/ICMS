from django.db import models
from django.conf import settings   # 👈 yahan se AUTH_USER_MODEL use karna hai

class LibraryBook(models.Model):
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=100)
    isbn = models.CharField(max_length=20, unique=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    available_copies = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def _str(self):   # ✅ _str ko _str_ karo
        return self.title


class BorrowRecord(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,   # ✅ ab direct User nahi, custom user handle karega
        on_delete=models.CASCADE
    )
    book = models.ForeignKey(LibraryBook, on_delete=models.CASCADE)
    borrow_date = models.DateTimeField(auto_now_add=True)
    return_date = models.DateTimeField(blank=True, null=True)
    is_returned = models.BooleanField(default=False)

    def _str_(self):
        return f"{self.student.username} borrowed {self.book.title}"


class Fine(models.Model):
    borrow = models.OneToOneField(BorrowRecord, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    paid = models.BooleanField(default=False)

    def _str_(self):
        return f"Fine for {self.borrow.student.username}"