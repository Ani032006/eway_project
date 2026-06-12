# E-Way Bill Suspicious Activity Dashboard
### Project Report

---

## What Is This Project?

Every time goods are transported across India, businesses are legally required to generate an **E-Way Bill** — a digital document that says *what* is being moved, *from where*, *to where*, and *by which vehicle*.

The problem is that fraudsters exploit this system. A vehicle might take a completely wrong route, make unplanned stops, visit tolls it has no business visiting, or keep running after the delivery is done. Catching this manually, across thousands of bills, is impossible.

This project builds a **dashboard that does it automatically.**

It takes raw E-Way Bill data, matches it against actual toll crossing records, runs detection algorithms, and flags anything that looks wrong — giving officers a clear, visual picture of what's suspicious and why.

---

## What Was Built

The project has two main parts working together:

### The Backend (the engine)
- Reads E-Way Bill data uploaded as Excel files and stores it in a database
- Pulls real toll crossing records for each vehicle from the database
- Runs detection logic to find suspicious patterns
- Serves all of this as an API that the frontend can call

### The Frontend (the face)
- A clean dashboard where officers can search, filter, and review bills
- A detailed view for each bill showing the vehicle's route plotted on a live map
- Toll crossing markers pinned directly on the map, colour-coded by what they mean
- Clear explanations of *why* a bill was flagged

---

## What I Learned

### 1. How Data Flows from Backend to Frontend
One of the biggest practical lessons was understanding how data actually travels through a full-stack app. An Excel file is uploaded → the backend parses it, enriches it with coordinates from pincode data, runs analysis, and saves it to MongoDB → when the frontend asks for a bill, the backend assembles all the related data (toll passes, road geometry, related bills) into one clean API response → the frontend receives it and renders it. Seeing this whole chain work end-to-end made the concept very concrete.

### 2. How API Keys Work in a Real Project
The project uses the **Mappls Maps API** (India's mapping platform) for two things — drawing routes on the map, and fetching real road geometry between toll points. Learning how to securely use an API key (keeping it in environment variables on the backend, loading the map SDK on the frontend) and handle cases where the API might fail or return unexpected data was a very practical lesson.

### 3. Building Your Own Algorithms
This is arguably the most interesting part. Rather than relying on a ready-made fraud detection tool, custom algorithms were written from scratch:

- **Cross-track distance** — to check if a toll is too far off the straight-line path between origin and destination
- **Bearing analysis** — to check if two E-Way Bills for the same vehicle are pointing in opposite directions at the same time (which is physically impossible)
- **Toll frequency detection** — to count how many times a vehicle hits the same plaza and flag repeat crossings as suspicious
- **Destination toll detection** — to figure out which toll is closest to the declared destination, treat that as the journey's end, and flag anything triggered after it

Writing these from first principles — working out the geometry, iterating when edge cases broke things — was a completely different experience from calling a library function.

### 4. Displaying Complex Data Meaningfully on the Frontend
Showing a number in a table is easy. Showing it in a way that an officer can immediately *understand* — colour-coded toll markers on a map, frequency tables, journey-end badges, suspicious reason cards — requires thinking carefully about what the person actually needs to know. This project gave good practice in translating raw data into genuinely useful UI.

---

## How It Can Be Made Better

### The Biggest Gap: Route Awareness After Delivery

Right now, the system detects duplicate toll crossings — but a clever driver can avoid this by simply **taking a different road back**, so the same toll never pings twice. The system currently won't catch that.

**The improvement:** Load a complete database of every toll plaza in India and their geographic positions. When a vehicle's bill is analysed:

1. Find the toll that is **geographically closest to the declared destination** — this is the journey-end toll
2. Any toll crossing that happens **after that point in time** is flagged — regardless of which road was taken or which plaza was used
3. This means you can detect post-delivery activity **even when the driver deliberately changes their route** to avoid triggering the same toll twice

This approach would also open up a new capability: **predicting what the driver is doing after delivery.** If post-destination tolls are clustered in one direction, the system could estimate where the vehicle went — whether it returned to origin, went somewhere else, or made an unregistered stop.

---

## In Short

This project takes a paper-trail problem — E-Way Bills — and turns it into an intelligent, visual, automated system. The core lessons are about how modern web applications actually work end-to-end, how to design detection logic for real-world fraud patterns, and how to present complex findings in a way that is immediately actionable.

The natural next step is making the post-delivery detection smarter — so that not just duplicate tolls, but *any* unexplained movement after the declared destination is caught and explained.
