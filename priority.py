import requests
from datetime import datetime

API_URL = "http://20.207.122.201/evaluation-service/notifications"
TOP_N = 10
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ2ZWxhbWFsYXBhdmFua3Jpc2huYUBnbWFpbC5jb20iLCJleHAiOjE3NzgwNjM4MDMsImlhdCI6MTc3ODA2MjkwMywiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6ImJhYWNkMDMyLWM4MjUtNGJjYS04NzRkLTQ0ZTgwN2I4MzNjMCIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InZlbGFtYWxhIHBhdmFuIGtyaXNobmEiLCJzdWIiOiIxMDkwZjRmZS1jOTJkLTQwOTUtOTcyMC1lOWVmNWQwMjhjNTQifSwiZW1haWwiOiJ2ZWxhbWFsYXBhdmFua3Jpc2huYUBnbWFpbC5jb20iLCJuYW1lIjoidmVsYW1hbGEgcGF2YW4ga3Jpc2huYSIsInJvbGxObyI6ImFtLnNjLnU0YWllMjMwNjMiLCJhY2Nlc3NDb2RlIjoiUFRCTW1RIiwiY2xpZW50SUQiOiIxMDkwZjRmZS1jOTJkLTQwOTUtOTcyMC1lOWVmNWQwMjhjNTQiLCJjbGllbnRTZWNyZXQiOiJ0WUJDYlpEa0pRSEVHalJEIn0.17N35s16OI6o8igIY-yc23Tp2QYjn5iYLbA3fH2SB7A"
TYPE_WEIGHTS = {
    "Placement": 3,
    "Result": 2,
    "Event": 1
}
def fetch_notifications():

    headers = {
        "Authorization": f"Bearer {TOKEN}"
    }

    response = requests.get(
        API_URL,
        headers=headers
    )

    if response.status_code != 200:
        raise Exception(
            f"API Error: {response.status_code}"
        )

    data = response.json()

    return data["notifications"]

def calculate_priority(notification):

    notification_type = notification["Type"]

    timestamp = notification["Timestamp"]

    # Type weight
    type_score = TYPE_WEIGHTS.get(
        notification_type,
        0
    ) * 100

    # Timestamp conversion
    notification_time = datetime.strptime(
        timestamp,
        "%Y-%m-%d %H:%M:%S"
    )

    current_time = datetime.now()

    # Recent notifications get higher score
    time_difference = (
        current_time - notification_time
    ).total_seconds()

    recency_bonus = max(
        0,
        100000 - int(time_difference)
    )

    total_score = (
        type_score + recency_bonus
    )

    return total_score
def get_top_notifications(notifications):

    for notification in notifications:

        notification["priority_score"] = (
            calculate_priority(notification)
        )

    sorted_notifications = sorted(
        notifications,
        key=lambda x: x["priority_score"],
        reverse=True
    )

    return sorted_notifications[:TOP_N]

def display_notifications(notifications):

    print("\nPRIORITY INBOX \n")

    for index, notification in enumerate(
        notifications,
        start=1
    ):

        print(f"Rank #{index}")

        print(f"ID: {notification['ID']}")

        print(f"Type: {notification['Type']}")

        print(f"Message: {notification['Message']}")

        print(f"Timestamp: {notification['Timestamp']}")

        print(
            f"Priority Score: {notification['priority_score']}"
        )


def main():

    try:

        notifications = fetch_notifications()

        top_notifications = get_top_notifications(
            notifications
        )

        display_notifications(
            top_notifications
        )

    except Exception as error:

        print("Error:", error)

if __name__ == "__main__":
    main()