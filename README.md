# SafetyDriver — Requirement Specification & Design Document

## 1. Document Purpose

This document defines the functional and non-functional requirements and the main design artifacts for SafetyDriver, a mobile application intended to help monitor observable signs of driver drowsiness and provide alerts.

The document is organized into seven sections:

1. Functional Requirements
2. Non-Functional Requirements
3. Data Flow Diagram (DFD)
4. Use Case Diagram
5. Class Diagram
6. Data Model
7. Interface Design Description

> **Implementation note:** Confirm each requirement against the current repository before treating it as an implemented feature. Mark features that are only planned as proposed requirements. Do not assume that a cloud service, remote server, or database exists unless the implementation requires it.

## 2. Team Work Distribution

| Team member | Main responsibility | Supporting responsibility | Deliverables |
|---|---|---|---|
| Member 1 | Functional Requirements | Coordinate interface requirements | Functional requirements table; function descriptions; interface feature list |
| Member 2 | Non-Functional Requirements | Review usability and accessibility of the interface | Non-functional requirements table; measurable acceptance criteria |
| Member 3 | Data Flow Diagram (DFD) | Collaborate on the Data Model with Member 5 | DFD Level 0 and Level 1; data-flow descriptions; ERD/data entity input |
| Member 4 | Use Case Diagram | Validate use cases against Member 1's functional requirements | Use Case Diagram; use case descriptions |
| Member 5 | Class Diagram | Collaborate on the Data Model with Member 3; consolidate the document | Class Diagram; class descriptions; final consistency review |

### Shared work

All members should agree on the application scope, actual and planned features, terminology, and diagrams. Members 1 and 2 should coordinate on interface design; Members 3 and 5 should coordinate on data design. Member 5 consolidates the document, but each section owner remains responsible for technical accuracy.

---

# 3. Functional Requirements

**Owner: Member 1**

Functional requirements describe what the system must do. Give every requirement a unique identifier (for example, `FR-01`) and make it specific enough to verify.

## 3.1 Camera Access and Driver Monitoring

- Describe how the user grants camera permission.
- Describe how the application starts and stops camera-based monitoring.
- Specify the expected behavior when permission is denied or the camera is unavailable.
- State which camera source is supported by the current implementation.

## 3.2 Facial Detection

- Describe how the system detects a driver's face in camera frames.
- Specify what happens when no face or multiple faces are detected, if applicable.
- Describe how the system handles temporary loss of facial landmarks.

## 3.3 Drowsiness Detection

- Describe the observable indicators used by the system, based on the actual implementation. Examples may include eye closure, eye aspect ratio (EAR), yawning or mouth aspect ratio (MAR), and head pose.
- Explain how indicators are processed over time to identify potential drowsiness.
- Document any thresholds, counters, or model-based classification actually used.

## 3.4 Driver State Assessment

- Describe the states the system can report, such as `Normal`, `Potential Drowsiness`, or `Face Not Detected`, only where supported by the implementation.
- Explain how the system changes between states.
- Avoid presenting the result as a medical diagnosis or a guarantee that a driver is safe to drive.

## 3.5 Alert and Notification

- Describe the alert triggered by a potential drowsiness event.
- Specify the supported alert types, such as sound or an on-screen message.
- Explain when an alert starts, stops, or resets.
- Document behavior when sound or notification permissions are unavailable.

## 3.6 Monitoring Session Management

- Describe how a monitoring session starts and ends.
- Specify what session information, if any, is recorded.
- Describe behavior when the application is paused, interrupted, or closed.

## 3.7 Error Handling and System Status

- Document expected handling for camera permission denial, camera failure, face-detection failure, and processing errors.
- Describe how the user is informed of a recoverable problem.
- Specify whether monitoring resumes automatically or requires user action.

## 3.8 Alert History Management

- State whether alerts or monitoring sessions are recorded.
- Describe what information is stored, such as event type and timestamp, if supported.
- Explain how users can view or clear records, if these actions are implemented.
- If the current app does not persist history, identify history management as a proposed feature rather than an existing one.

## 3.9 Functional Requirements Table

Use a table like the following and complete it based on repository evidence.

| ID | Requirement | Priority | Status | Acceptance criteria |
|---|---|---|---|---|
| FR-01 | The app requests camera access before starting camera-based monitoring. | Must have | To verify | Monitoring does not start without the required permission. |
| FR-02 | The app processes camera frames to detect a driver's face. | Must have | To verify | The app reports face-detection status when processing valid frames. |
| FR-03 | The app identifies potential drowsiness using supported detection logic. | Must have | To verify | Defined test inputs produce the expected state according to documented rules. |
| FR-04 | The app provides an alert when its drowsiness condition is met. | Must have | To verify | A qualifying test event triggers the configured alert. |
| FR-05 | The user can stop monitoring. | Must have | To verify | Camera processing stops after monitoring is stopped. |
| FR-06 | The app communicates camera or processing errors to the user. | Should have | To verify | A supported failure produces a clear error state or message. |
| FR-07 | The app stores and displays alert history. | Proposed / verify | To verify | If implemented, a recorded event can be retrieved and displayed. |

**Status values:** `Implemented`, `Partially implemented`, `Planned`, or `Not supported`.

---

# 4. Non-Functional Requirements

**Owner: Member 2**

Non-functional requirements describe how well the system should operate and the constraints under which it must work. Use measurable targets where possible, and label targets that have not yet been tested as proposed.

## 4.1 Performance

- Define an acceptable processing delay and alert response time.
- Define the expected monitoring frame rate or processing frequency, if measurable.
- Assess battery and CPU usage on supported mobile devices.
- Record the device and test conditions used for performance measurements.

## 4.2 Detection Accuracy and Reliability

- Define how detection performance will be evaluated.
- Test under different lighting conditions, face positions, glasses, and camera angles where practical.
- Track false positives and false negatives using a defined test set.
- State that performance claims require test evidence; do not claim a particular accuracy without measurements.

## 4.3 Usability

- Make monitoring status and alerts easy to understand.
- Keep the start and stop actions clear.
- Provide understandable guidance when camera access is denied or the face cannot be detected.
- Ensure text, icons, and warning states are distinguishable.

## 4.4 Mobile Device Compatibility

- List the target operating systems and minimum supported versions.
- Document device and camera requirements.
- Test screen sizes, camera permissions, interruptions, and background/foreground behavior on target devices.
- Confirm that the existing implementation and its dependencies can run on the intended mobile platform.

## 4.5 Privacy and Data Security

- Explain when camera frames are processed and whether they leave the device.
- Store only data needed for the app's stated purpose.
- If event history is saved, define its location, access controls, and deletion behavior.
- Do not claim that data is stored locally or never transmitted until verified in the implementation.

## 4.6 Maintainability

- Keep detection, camera access, alert handling, session management, and data storage logically separated where practical.
- Use consistent names, error handling, and documentation.
- Make thresholds and configuration values easy to locate and review.
- Document dependencies and supported versions.

## 4.7 Non-Functional Requirements Table

| ID | Requirement | Measurement / verification | Target or status |
|---|---|---|---|
| NFR-01 | The app should respond to a qualifying drowsiness event promptly. | Measure event-to-alert delay on target devices. | Target to be defined and tested |
| NFR-02 | The app should handle temporary face-detection loss without crashing. | Test face occlusion and movement out of frame. | Required |
| NFR-03 | The interface should clearly show whether monitoring is active. | Usability review and functional test. | Required |
| NFR-04 | Camera data handling should match the documented privacy policy. | Review code paths, permissions, storage, and network use. | Verify implementation |
| NFR-05 | The app should operate on declared target devices. | Run compatibility tests on the target device matrix. | Device matrix to be defined |

---

# 5. Data Flow Diagram (DFD)

**Owner: Member 3**

The DFD explains how data enters the system, how it is processed, and where outputs or records go.

## 5.1 DFD Level 0 — Context Diagram

Show SafetyDriver as one system process and its external entities. Possible elements include:

- **Driver / User:** starts or stops monitoring and receives status messages and alerts.
- **Camera:** supplies image frames to the app.
- **SafetyDriver:** processes the frames and produces a monitoring state and alerts.

Only include an external entity if it represents a real boundary in the chosen system model. If the camera is treated as a device interface rather than an external system, explain that modeling choice.

## 5.2 DFD Level 1 — Main System Processes

A possible decomposition is:

1. **Capture Camera Frames** — obtain image frames after permission is granted.
2. **Detect Face and Facial Features** — locate the face and required landmarks.
3. **Analyze Drowsiness Indicators** — evaluate supported indicators and detection rules or model output.
4. **Determine Driver State** — produce the current state based on the analysis.
5. **Issue Alert** — provide a warning when the defined condition is met.
6. **Record Events (if supported)** — save event/session information to a data store.

Adjust the processes to match the actual architecture. Do not show a persistent data store if the application does not persist data.

## 5.3 Data Flows, Processes, and Data Stores

For each flow, label the data being transferred. Examples:

- Camera frames → facial feature detection
- Facial landmarks or measurements → drowsiness analysis
- Analysis result → driver-state assessment
- Driver state → alert handling and user interface
- Alert event → event history store, if implemented

## 5.4 DFD Validation Checklist

- Every process has a meaningful input and output.
- Data-flow labels describe information, not vague actions.
- The diagram does not show direct data transfer between external entities without a process.
- Processes and data stores are consistent with the functional requirements.
- The Level 0 and Level 1 diagrams use consistent names and boundaries.

**Deliverables:** DFD Level 0, DFD Level 1, and a short explanation of each process and data flow.

---

# 6. Use Case Diagram

**Owner: Member 4**

The Use Case Diagram describes how actors interact with SafetyDriver.

## 6.1 System Actors

- **Driver / User:** the primary actor who operates the app and receives its results.
- **Camera Device:** include as an actor only if the chosen UML model treats it as an external interacting system; otherwise model it within the system boundary.

Do not add administrator, cloud service, or emergency service actors unless those roles exist in the agreed scope.

## 6.2 Main Use Cases

Potential use cases, subject to implementation verification:

- Grant Camera Permission
- Start Monitoring
- Stop Monitoring
- View Monitoring Status
- Receive Drowsiness Alert
- Handle Camera or Detection Error
- View Alert History (if supported)
- Clear Alert History (if supported)

## 6.3 Actor–Use Case Relationships

- Connect the Driver / User to actions the user initiates or information the user receives.
- Use `<<include>>` only when one use case always invokes another as part of its behavior.
- Use `<<extend>>` only for optional or conditional behavior that extends a base use case.
- Keep the system boundary labeled `SafetyDriver`.

## 6.4 Main Use Case Descriptions

Use the following template for each important use case.

| Field | Description |
|---|---|
| Use Case ID | Unique identifier, e.g. UC-01 |
| Name | Start Monitoring |
| Primary actor | Driver / User |
| Preconditions | The app is open and required camera permission is available. |
| Main flow | User selects Start Monitoring; the app begins capturing and processing frames; the current state is displayed. |
| Alternative / exception flows | Permission denied, camera unavailable, or no face detected. |
| Postconditions | Monitoring is active, or the app reports why it could not start. |

Create detailed descriptions for at least `Start Monitoring`, `Stop Monitoring`, and `Receive Drowsiness Alert`. Include history use cases only if history is in scope.

---

# 7. Class Diagram

**Owner: Member 5**

The Class Diagram shows the static structure of the software. Class names below are candidates, not a claim that these exact classes already exist in the repository.

## 7.1 Candidate Classes

- **CameraManager** — manages camera access and frame capture.
- **FaceDetector** — detects a face and relevant facial landmarks.
- **DrowsinessDetector** — evaluates indicators or invokes the detection model.
- **DriverStateManager** — maintains or determines the current driver-monitoring state, if this responsibility is separate in the implementation.
- **AlertManager** — triggers and stops supported alerts.
- **MonitoringSession** — represents the state and duration of a monitoring session, if session management is implemented.
- **HistoryManager** — stores and retrieves events, only if persistent history is supported.
- **UserInterface / MonitoringScreen** — displays status and receives user actions, depending on the chosen architecture.

Merge or rename classes to match the real code. Do not create classes solely to fill out the diagram.

## 7.2 Class Attributes and Methods

For each class, identify only relevant attributes and operations. For example:

**CameraManager**
- Attributes: camera status, permission status (if managed here)
- Methods: request permission, start capture, stop capture, retrieve frame

**DrowsinessDetector**
- Attributes: configured thresholds or model reference, if applicable
- Methods: extract or receive indicators, evaluate state, return detection result

**AlertManager**
- Attributes: alert status, configured alert type
- Methods: trigger alert, stop alert, reset alert

These are illustrative design candidates; use the repository's actual responsibilities and interfaces.

## 7.3 Class Relationships

Show only relationships supported by the design, such as:

- CameraManager supplies frames to the facial analysis component.
- FaceDetector provides landmarks or measurements to DrowsinessDetector.
- DrowsinessDetector returns a result to the component responsible for driver state.
- The state or event component requests an alert from AlertManager.
- A session or event component interacts with HistoryManager if event storage exists.

Label associations and multiplicities where meaningful. Use dependency arrows when one component only uses another temporarily.

## 7.4 Class Diagram Validation

- Each class has a clear responsibility.
- Method names are consistent with the implementation or agreed design.
- Relationships do not contradict the DFD.
- Data entities in the Class Diagram are consistent with the Data Model.
- Avoid putting every function into one oversized class.

**Deliverable:** Class Diagram plus a short table describing each class's responsibility.

---

# 8. Data Model

**Co-owners: Members 3 and 5**

The Data Model identifies persistent information and relationships. First determine whether SafetyDriver actually needs persistent storage.

## 8.1 Data Entities

Potential entities, only if required:

### MonitoringSession
- `session_id` — primary key
- `start_time`
- `end_time`
- `session_status`

### AlertEvent
- `event_id` — primary key
- `session_id` — foreign key to MonitoringSession, if sessions are stored
- `event_type`
- `event_timestamp`
- `event_details`, if needed and appropriate

These are proposed examples. Remove fields and entities that are not needed by the application. Avoid storing camera frames or facial data unless there is a clear requirement, justification, and privacy review.

## 8.2 Primary Keys and Foreign Keys

- Define a primary key for each persisted entity.
- Define a foreign key only when a real relationship exists between stored records.
- If `AlertEvent` belongs to a `MonitoringSession`, use `session_id` as its foreign key.
- Document any required constraints, such as non-null timestamps.

## 8.3 Entity Relationship Diagram (ERD)

If the app persists sessions and events, a possible relationship is:

- One `MonitoringSession` can contain zero or many `AlertEvent` records.
- Each `AlertEvent` belongs to one `MonitoringSession`.

If no persistent database exists or is required, document the data structures used at runtime and state that persistent storage is outside the current scope instead of inventing database tables.

## 8.4 Data Storage and Retention

Document:

- Where data is stored (memory, local file, local database, or remote storage).
- What information is retained and why.
- How long records are kept.
- How records are deleted.
- Whether any data is transmitted off-device.

**Deliverables:** Entity/attribute table, ERD where applicable, and a short data-retention explanation.

---

# 9. Interface Design Description

**Coordination: Member 1 defines functional behavior; Member 2 reviews usability; Member 5 consolidates**

Describe the interface in text and/or wireframes. Include only screens that are part of the agreed product scope.

## 9.1 User Interface Overview

- Identify the target device and platform.
- Explain the main navigation flow.
- Describe how the interface communicates monitoring status, errors, and alerts.
- Ensure the interface reflects the actual functions listed in Section 3.

## 9.2 Home Screen

Describe:

- App name and short purpose statement.
- Start Monitoring action.
- Camera permission prompt or permission status, as appropriate.
- Access to settings or history, if supported.

## 9.3 Monitoring Screen

Describe:

- Camera preview, if included.
- Current monitoring state.
- Clear Stop Monitoring action.
- Face-detection or camera status.
- Appropriate behavior when a face is not detected.

## 9.4 Drowsiness Alert Interface

Describe:

- Alert message and visual emphasis.
- Sound or other supported alert mechanism.
- How the alert is stopped or reset.
- How the interface avoids implying that the system can guarantee driver safety.

## 9.5 Monitoring History Screen

Include only if the app records history. Describe the event list, timestamps, details shown, and any clear/delete action. If history is not implemented, mark this screen as a proposed feature or omit it.

## 9.6 Settings Screen

Include only settings that exist or are explicitly planned, such as alert preferences or supported thresholds. Do not expose internal configuration values to users without a product reason.

## 9.7 Navigation Flow

Provide a simple flow, for example:

`Home → Grant Camera Permission → Monitoring → (Potential Drowsiness → Alert) → Stop Monitoring`

Add error branches for denied permission or unavailable camera. Add History or Settings branches only if they are in scope.

**Deliverables:** Screen descriptions, wireframes/mockups, and a navigation-flow diagram.

---

# 10. Suggested Work Plan

| Phase | Work | Responsible members |
|---|---|---|
| 1 | Agree on scope, current capabilities, and planned features | All members |
| 2 | Draft functional and non-functional requirements | Members 1 and 2 |
| 3 | Build DFD and Use Case Diagram | Members 3 and 4 |
| 4 | Build Class Diagram and Data Model | Members 5 and 3 |
| 5 | Complete interface descriptions and wireframes | Members 1, 2, and 5 |
| 6 | Cross-check diagrams, terminology, and requirement IDs | All members; Member 5 consolidates |

## 10.1 Final Review Checklist

- [ ] Functional requirements describe specific, testable behavior.
- [ ] Non-functional requirements include measurable criteria or are clearly marked as targets to be defined.
- [ ] Implemented, planned, and unsupported features are distinguished.
- [ ] DFD processes match the functional requirements.
- [ ] Use cases represent real user goals and system behavior.
- [ ] Class responsibilities and relationships match the intended architecture.
- [ ] Data Model reflects actual persistence needs and does not invent a database.
- [ ] Interface screens match the documented functionality.
- [ ] Privacy and data-retention statements have been checked against the code.
- [ ] All diagrams have titles, readable labels, and consistent terminology.

## 10.2 Safety and Scope Statement

SafetyDriver is intended to identify observable signs associated with potential drowsiness and provide an alert. Detection results can be affected by lighting, camera placement, occlusion, device performance, and other conditions. The application must not be described as a substitute for adequate rest, responsible driving, or professional medical assessment.
