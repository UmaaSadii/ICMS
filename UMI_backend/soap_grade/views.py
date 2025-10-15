from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import xml.etree.ElementTree as ET

@csrf_exempt
def soap_service(request):
    if request.method == 'POST':
        # Parse the SOAP request
        try:
            root = ET.fromstring(request.body)
            # Assume the SOAP body has the method
            body = root.find('.//{http://schemas.xmlsoap.org/soap/envelope/}Body')
            if body is not None:
                # Check for get_student_grades
                get_grades = body.find('.//{urn:grade_service}get_student_grades')
                if get_grades is not None:
                    student_id = get_grades.find('student_id').text
                    response = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Body>
        <ns:get_student_gradesResponse xmlns:ns="urn:grade_service">
            <result>Grades for student {student_id}: A, B, C</result>
        </ns:get_student_gradesResponse>
    </soapenv:Body>
</soapenv:Envelope>"""
                    return HttpResponse(response, content_type='text/xml')

                # Check for update_grade
                update_grade = body.find('.//{urn:grade_service}update_grade')
                if update_grade is not None:
                    student_id = update_grade.find('student_id').text
                    course = update_grade.find('course').text
                    grade = update_grade.find('grade').text
                    response = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Body>
        <ns:update_gradeResponse xmlns:ns="urn:grade_service">
            <result>Updated grade for {student_id} in {course} to {grade}</result>
        </ns:update_gradeResponse>
    </soapenv:Body>
</soapenv:Envelope>"""
                    return HttpResponse(response, content_type='text/xml')
        except Exception as e:
            pass
    return HttpResponse("SOAP Grade Service", content_type='text/plain')
