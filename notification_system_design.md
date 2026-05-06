# Stage 1

The notification platform is designed to provide students with real-time updates related to placements, events, and examination results through a structured REST API architecture with predictable endpoint naming conventions and consistent JSON response formats. The system supports core actions such as fetching all notifications using `GET /api/notifications`, fetching unread notifications using `GET /api/notifications/unread`, marking individual notifications as read using `PATCH /api/notifications/:id/read`, marking all notifications as read using `PATCH /api/notifications/read-all`, filtering notifications based on type using `GET /api/notifications/filter?type=Placement`, and fetching top priority notifications using `GET /api/notifications/priority?limit=10`. All APIs follow standard request headers including `Authorization: Bearer <token>` and `Content-Type: application/json` while maintaining consistent response structures for easier frontend integration and maintainability. The notification object schema is designed with essential fields such as `id`, `type`, `message`, `isRead`, and `createdAt` where notification types include `Placement`, `Result`, and `Event`. A sample notification response structure is defined as `{ "id": "n101", "type": "Placement", "message": "Amazon hiring for SDE role", "isRead": false, "createdAt": "2026-04-22T17:51:18Z" }`. Pagination and filtering support are included using query parameters such as `page`, `limit`, and `type` to improve scalability and reduce unnecessary data transfer. The platform also includes a real-time notification mechanism implemented using WebSockets with Socket.IO where newly created notifications are instantly pushed from the backend notification service to connected student clients through a `new_notification` event, thereby reducing API polling overhead and improving user experience. The backend architecture follows a modular structure consisting of routes, controllers, services, middleware, and reusable logging integration using the custom logging middleware function `Log(stack, level, package, message)` to maintain centralized monitoring, debugging, and observability across the application.
 ----
# Stage 2

For the notification platform, PostgreSQL is selected as the persistent storage solution because the application requires structured relational storage, efficient querying, filtering, pagination, indexing, and transactional consistency while handling notifications for a large number of students. PostgreSQL provides strong support for relational schemas, optimized query execution, indexing, scalability, and concurrent read/write operations which makes it suitable for notification-based systems where unread notification retrieval, sorting by timestamps, and filtering based on notification type are frequent operations. The database also supports future scalability features such as partitioning, replication, and caching integration.

The database schema is designed using two main tables: `students` and `notifications`.


### Students Table

```sql
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    department VARCHAR(100)
);
```
 ---
### notification Table
```sql
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY,
    student_id INT REFERENCES students(student_id),
    type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    priority_score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### indexes

CREATE INDEX idx_notifications_student_read_created
ON notifications(student_id, is_read, created_at);

CREATE INDEX idx_notifications_type
ON notifications(type);

----

As the number of students and notifications increases, the application may face several scalability and performance issues such as slower query execution, expensive table scans, increased memory usage, delayed sorting operations, higher database response times, and increased load caused by repeated unread notification requests. Fetching notifications without indexing may result in full table scans which significantly increases computational cost. Large datasets may also impact pagination performance and real-time notification delivery speed if requests continuously hit the database.

----

To improve scalability and performance, indexing is introduced on frequently queried columns such as student_id, is_read, type, and created_at which reduces query search complexity and improves filtering performance. Composite indexing on (student_id, is_read, created_at) is specifically used because unread notification retrieval is expected to be one of the most common operations. Pagination using LIMIT and OFFSET is implemented to avoid fetching large datasets at once. Redis caching can be introduced for storing unread notification counts and recently accessed notifications to reduce repeated database queries. Database partitioning based on timestamps can also be applied for handling very large notification datasets while improving archival efficiency and query speed. WebSocket-based real-time notification delivery further reduces excessive API polling from clients.

---

SQL queries based on my DB schema and RESTAPIs that i designed:

### Fetch All Notifications with Pagination
```sql
SELECT notification_id, type, message, is_read, created_at
FROM notifications
WHERE student_id = 1042
ORDER BY created_at DESC
LIMIT 10 OFFSET 0; 
```
### Fetch Unread Notifications
```sql
SELECT notification_id, type, message, created_at
FROM notifications
WHERE student_id = 1042
AND is_read = FALSE
ORDER BY created_at DESC;
```
### Filter Notifications by Type
```sql
SELECT notification_id, type, message, created_at
FROM notifications
WHERE student_id = 1042
AND type = 'Placement'
ORDER BY created_at DESC;
```

### Fetch Priority Notifications
```sql
SELECT notification_id, type, message, priority_score
FROM notifications
WHERE student_id = 1042
AND is_read = FALSE
ORDER BY priority_score DESC, created_at DESC
LIMIT 10;
```
### Mark Notification as Read
```sql
UPDATE notifications
SET is_read = TRUE
WHERE notification_id = 'n101';
Mark All Notifications as Read
UPDATE notifications
SET is_read = TRUE
WHERE student_id = 1042;
```
# stage 3

Yes, The given query is functionally correct because it successfully retrieves unread notifications of a particular student ordered by creation time, however the query becomes slow as the database grows to millions of records because it performs filtering and sorting operations on a very large notifications table. The query currently uses `SELECT *` which is inefficient because it fetches all columns from the table even when only a few fields are required by the API response, resulting in unnecessary memory usage, increased I/O cost, and higher network overhead. The query also becomes expensive because the database has to scan a large number of rows to filter notifications where `studentID = 1042` and `isRead = false`, followed by an additional sorting operation using `ORDER BY createdAt ASC`. Without proper indexing, the likely computational cost becomes close to a full table scan with sorting complexity approximately around `O(n log n)` for large datasets, which significantly affects performance when the notifications table contains millions of records.

The query can be improved by selecting only the required columns instead of using `SELECT *` and by creating a composite index on frequently filtered and sorted columns. A better optimized query would be:

```sql
SELECT notification_id, notificationType, message, createdAt
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt ASC
LIMIT 50;
```
The addition of LIMIT helps reduce unnecessary data retrieval and improves API response time by fetching only the required notifications. To further optimize the query, a composite index should be created on (studentID, isRead, createdAt) because these columns are repeatedly used together in filtering and sorting operations. Example index:
``` sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(studentID, isRead, createdAt);
```
Adding indexes on every column is not an effective solution because indexes themselves consume additional storage and increase write overhead during insert, update, and delete operations. Excessive indexing can slow down notification creation performance since every insert operation would also require updating multiple indexes. Indexes should therefore only be created on columns that are frequently used in filtering, sorting, joins, or search operations.

To find all students who received a placement notification within the last 7 days, the following query can be used:
```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days';
```
This query efficiently filters notifications based on notification type and timestamp while returning unique student IDs.This system can be further optimized may be using caching machanism.

# stage 4
Fetching notifications from the database on every page load for every student can significantly overload the database as the number of users and notifications increases.
Repeated unread notification queries, sorting operations, and filtering requests create high read traffic which results in slower API responses, increased database latency, higher server load, and poor user experience. 
To improve performance and scalability, multiple optimization strategies can be introduced at different layers of the system architecture.One of the primary solutions is introducing a caching layer to temporarily store frequently accessed notification data such as unread notification counts, recently fetched notifications, and priority notifications. Since many users repeatedly request similar notification data during short intervals, this can reduce unnecessary database hits and improve API response times significantly. 
Cached data can be refreshed whenever a new notification is created or an existing notification is marked as read. 
The tradeoff of caching is that cache invalidation and synchronization become additional challenges because stale data may temporarily exist if updates are not properly handled.Pagination should also be enforced for all notification APIs so that only a limited number of notifications are fetched at a time instead of loading the complete notification history. Using `LIMIT` and `OFFSET` reduces memory usage, network overhead, and database processing cost. 
The tradeoff is that pagination may require additional API calls when users scroll through older notifications, but overall system performance improves considerably.Another important improvement is replacing continuous API polling with WebSocket-based real-time notification delivery using Socket.IO. Instead of students repeatedly requesting notifications through REST APIs, the server can push newly created notifications directly to connected clients in real time. This reduces repeated database access and improves user experience by delivering instant updates. The tradeoff is that maintaining persistent WebSocket connections increases server-side connection management complexity and memory usage.Database indexing should continue to be optimized on columns frequently used in filtering and sorting operations such as `studentID`, `isRead`, `notificationType`, and `createdAt`. Proper indexing improves query execution speed while reducing full table scans. However, excessive indexing increases storage usage and slows down insert operations because indexes must also be updated whenever new notifications are created.For very large datasets, table partitioning based on timestamps can also be introduced so that older notifications are stored separately from recent active notifications. This reduces query search space and improves retrieval performance for recent notifications. Read replicas can additionally be used to separate read-heavy notification APIs from write operations, thereby distributing database load across multiple database instances. The tradeoff of replication is potential replication lag where newly created notifications may take a short time to appear on replica databases.Overall, the combination of Redis caching, pagination, WebSocket-based real-time delivery, optimized indexing, partitioning, and read replicas provides a scalable architecture capable of handling large-scale notification traffic while maintaining fast API responses and a better user experience. Thats what I believe ..

# stage 5 

# Stage 5



The implementation executes all operations sequentially for every student which makes the system slow and inefficient for large-scale notification delivery. Sending emails, saving notifications to the database, and pushing real-time notifications one after another increases overall response time and blocks the application flow. The implementation also lacks retry mechanisms, concurrency handling, queue processing, and proper failure recovery support which makes it unreliable for handling notifications for 50,000 students simultaneously.

---

If the email sending process fails midway, some students may receive notifications while others may not, resulting in inconsistent system behavior. Retrying the entire process may also create duplicate notifications for students who already received them. Failed notification jobs should therefore be tracked separately and retried using background workers and retry queues instead of restarting the entire operation.

---



The system should be redesigned using asynchronous processing with message queues such as RabbitMQ or Kafka. Notifications should first be stored in the database, after which notification jobs can be pushed into a queue. Background workers can then independently process email delivery and real-time notifications concurrently. This reduces blocking operations, improves scalability, and allows failed jobs to be retried safely without affecting the main application flow.

---



Saving notifications to the database and sending emails should not happen together in a tightly coupled synchronous flow. Database storage is a critical internal operation because it acts as the source of truth for the application, while email delivery is an external operation that may fail due to network issues or third-party API failures. Even if email delivery fails, the notification should still exist inside the system so that users can view it later when they log in. Failed email jobs can then be retried separately without affecting database consistency.

---

##  Revised Pseudocode

```python
function notify_all(student_ids, message):

    for student_id in student_ids:

        notification = save_to_db(
            student_id,
            message
        )

        push_to_queue({
            "student_id": student_id,
            "notification_id": notification.id,
            "message": message
        })


worker_process():

    while queue not empty:

        job = get_next_job()

        try:

            send_email(
                job.student_id,
                job.message
            )

            push_realtime_notification(
                job.student_id,
                job.message
            )

            mark_job_completed(job)

        except Exception:

            retry_job(job)
            ```