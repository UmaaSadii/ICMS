from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import LibraryBook, BorrowRecord, Fine
from .serializers import LibraryBookSerializer, BorrowRecordSerializer, FineSerializer
from .permissions import IsAdminOrReadOnly


class LibraryBookViewSet(viewsets.ModelViewSet):
    queryset = LibraryBook.objects.all().order_by("-created_at")
    serializer_class = LibraryBookSerializer
    permission_classes = [IsAdminOrReadOnly]

    # Student Borrow Book
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def borrow(self, request, pk=None):
        book = self.get_object()
        if book.available_copies < 1:
            return Response({"error": "Book not available"}, status=status.HTTP_400_BAD_REQUEST)

        borrow_record = BorrowRecord.objects.create(
            student=request.user,
            book=book
        )
        book.available_copies -= 1
        book.save()

        return Response(BorrowRecordSerializer(borrow_record).data, status=status.HTTP_201_CREATED)

    # Student Return Book
    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def return_book(self, request, pk=None):
        book = self.get_object()
        borrow_record = BorrowRecord.objects.filter(
            student=request.user, book=book, is_returned=False
        ).first()

        if not borrow_record:
            return Response({"error": "No active borrow found"}, status=status.HTTP_400_BAD_REQUEST)

        borrow_record.is_returned = True
        borrow_record.save()

        book.available_copies += 1
        book.save()

        return Response({"success": "Book returned successfully"}, status=status.HTTP_200_OK)


class FineViewSet(viewsets.ModelViewSet):
    queryset = Fine.objects.all()
    serializer_class = FineSerializer
    permission_classes = [IsAuthenticated]