from rest_framework import serializers
from .models import LibraryBook, BorrowRecord, Fine

class LibraryBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryBook
        fields = "__all__"


class BorrowRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = BorrowRecord
        fields = "__all__"


class FineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fine
        fields = "__all__"