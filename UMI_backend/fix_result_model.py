import sqlite3
import os

# Path to the database
db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

# Connect to the database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Fixing Result model database schema...")

try:
    # Check if the course_id column already exists
    cursor.execute("PRAGMA table_info(academics_result)")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]

    if 'course_id' not in column_names:
        print("Adding course_id column to academics_result table...")

        # Add the course_id column
        cursor.execute("ALTER TABLE academics_result ADD COLUMN course_id INTEGER REFERENCES academics_course(course_id)")

        # Update existing records to have null course_id (since we don't have course data for old results)
        cursor.execute("UPDATE academics_result SET course_id = NULL")

        print("Successfully added course_id column!")
    else:
        print("course_id column already exists.")

    # Check if the old subject column exists and remove it if it does
    if 'subject' in column_names:
        print("Removing old subject column...")

        # Create a temporary table without the subject column
        cursor.execute("""
            CREATE TABLE academics_result_temp (
                result_id INTEGER PRIMARY KEY,
                student_id INTEGER,
                course_id INTEGER,
                exam_type VARCHAR(50),
                exam_date DATE,
                assignment1_marks REAL DEFAULT 0,
                assignment2_marks REAL DEFAULT 0,
                assignment3_marks REAL DEFAULT 0,
                mid_term_marks REAL DEFAULT 0,
                total_marks REAL DEFAULT 40,
                obtained_marks REAL DEFAULT 0,
                grade VARCHAR(2)
            )
        """)

        # Copy data from old table to new table (without subject column)
        cursor.execute("""
            INSERT INTO academics_result_temp (
                result_id, student_id, course_id, exam_type, exam_date,
                assignment1_marks, assignment2_marks, assignment3_marks, mid_term_marks,
                total_marks, obtained_marks, grade
            )
            SELECT
                result_id, student_id, course_id, exam_type, exam_date,
                assignment1_marks, assignment2_marks, assignment3_marks, mid_term_marks,
                total_marks, obtained_marks, grade
            FROM academics_result
        """)

        # Drop the old table
        cursor.execute("DROP TABLE academics_result")

        # Rename the new table
        cursor.execute("ALTER TABLE academics_result_temp RENAME TO academics_result")

        print("Successfully removed subject column and updated table structure!")

    # Add the new assignment and mid_term columns if they don't exist
    for column in ['assignment1_marks', 'assignment2_marks', 'assignment3_marks', 'mid_term_marks']:
        if column not in column_names:
            print(f"Adding {column} column...")
            cursor.execute(f"ALTER TABLE academics_result ADD COLUMN {column} REAL DEFAULT 0")

    # Update total_marks to be 40 (5+5+5+25) if it's currently 100
    cursor.execute("UPDATE academics_result SET total_marks = 40 WHERE total_marks = 100")

    # Commit all changes
    conn.commit()

    print("Database schema fixed successfully!")

    # Show the final table structure
    cursor.execute("PRAGMA table_info(academics_result)")
    columns = cursor.fetchall()
    print("\nFinal academics_result table structure:")
    for col in columns:
        print(f"  {col[1]} ({col[2]}) - {'NULL' if col[3] else 'NOT NULL'}")

except Exception as e:
    print(f"Error fixing database: {e}")
    conn.rollback()
finally:
    conn.close()
