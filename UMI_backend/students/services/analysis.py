# students/services/analysis.py
from django.db.models import Sum
from academics.models import Result, Fee, Scholarship

def generate_performance_notes(student):
    """
    Rule-based 'AI style' summary.
    Future me yahan LLM call plug kar sakti ho.
    """
    # 1) Basic stats (already on student)
    attendance = student.attendance_percentage or 0
    gpa = student.gpa or 0

    # 2) Results snapshot
    results_qs = Result.objects.filter(student=student).order_by("-exam_date", "-result_id")
    last3 = list(results_qs[:3])
    last3_lines = []
    for r in last3:
        pct = None
        if r.total_marks and r.obtained_marks is not None:
            pct = round((float(r.obtained_marks) / float(r.total_marks)) * 100, 2)
        last3_lines.append(
            f"{r.subject or 'Subject'}: {r.obtained_marks}/{r.total_marks}"
            + (f" (~{pct}%)" if pct is not None else "")
        )

    # 3) Fees summary
    fees_qs = Fee.objects.filter(student=student)
    total_balance = 0.0
    for f in fees_qs:
        total_balance += float(f.amount) - float(f.paid_amount)

    # 4) Scholarships
    scholarships = list(
        Scholarship.objects.filter(students=student).values_list("name", flat=True)
    )

    # 5) Simple narrative
    parts = []
    parts.append(f"Attendance: {attendance:.1f}% | GPA: {gpa:.2f}.")
    if last3_lines:
        parts.append("Recent results: " + "; ".join(last3_lines) + ".")
    else:
        parts.append("Recent results: No records yet.")
    if total_balance > 0:
        parts.append(f"Outstanding fee balance: {total_balance:.2f}.")
    else:
        parts.append("Fees are clear (no outstanding balance).")
    if scholarships:
        parts.append("Scholarships: " + ", ".join(scholarships) + ".")
    else:
        parts.append("No scholarships recorded.")

    # Light recommendation
    recs = []
    if attendance < 80:
        recs.append("Improve attendance to 80%+.")
    if gpa < 2.5:
        recs.append("Focus on weak subjects to raise GPA.")
    if total_balance > 0:
        recs.append("Clear outstanding fees to avoid holds.")
    if not recs:
        recs.append("Performance trending well. Keep it up!")

    parts.append("Recommendations: " + " ".join(recs))

    return " ".join(parts)