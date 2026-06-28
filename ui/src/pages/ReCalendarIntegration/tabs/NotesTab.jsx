import React from "react";
import { Card, Alert, Badge } from "react-bootstrap";

export default function NotesTab({ config, onChange }) {
  return (
    <div>
      <Card>
        <Card.Header>
          Notes Integration{" "}
          <Badge bg="warning" text="dark">
            Coming Soon
          </Badge>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <Alert.Heading>Notes Integration</Alert.Heading>
            <p>
              This tab will allow you to configure integrations for the Notes
              pages of your ReCalendar PDF.
            </p>
            <p>Planned features:</p>
            <ul>
              <li>
                Connect to note-taking apps (Obsidian, Notion, Logseq, etc.)
              </li>
              <li>Sync handwritten notes via OCR recognition</li>
              <li>Auto-populate notes pages with daily summaries</li>
              <li>
                Link with handwritten notes scanned from the reMarkable
              </li>
            </ul>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
}
