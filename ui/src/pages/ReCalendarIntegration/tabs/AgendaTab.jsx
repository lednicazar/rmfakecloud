import React, { useState, useEffect } from "react";
import { Card, Alert, Form, Button, Badge, Spinner } from "react-bootstrap";
import apiService from "../../../services/api.service";

export default function AgendaTab({ config, onChange }) {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [icsUrl, setIcsUrl] = useState(config.agenda?.icsUrl || "");
  const [selectedIntegration, setSelectedIntegration] = useState(
    config.agenda?.integrationId || ""
  );

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      const data = await apiService.listintegration();
      const icsIntegrations = data.filter((i) => i.Provider === "ics");
      setIntegrations(icsIntegrations);
    } catch (e) {
      console.error("Failed to load integrations:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    onChange({
      ...config,
      agenda: {
        ...config.agenda,
        icsUrl,
        integrationId: selectedIntegration,
      },
    });
  }

  return (
    <div>
      <Card>
        <Card.Header>
          ICS Calendar Integration{" "}
          <Badge bg="warning" text="dark">
            Coming Soon
          </Badge>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <Alert.Heading>Agenda Integration</Alert.Heading>
            <p>
              This tab will allow you to connect your ICS calendar feeds to
              populate the Agenda pages of your ReCalendar PDF.
            </p>
            <p>Features coming soon:</p>
            <ul>
              <li>
                Import ICS calendar URLs (Google Calendar, Outlook, etc.)
              </li>
              <li>Select which calendar events to show on each day</li>
              <li>
                Link with existing ICS integrations in rmfakecloud
              </li>
              <li>Filter events by category or calendar</li>
            </ul>
          </Alert>

          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" /> Loading...
            </div>
          ) : (
            <>
              {integrations.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label>Existing ICS Integrations</Form.Label>
                  <Form.Select
                    value={selectedIntegration}
                    onChange={(e) => setSelectedIntegration(e.target.value)}
                  >
                    <option value="">-- Select an ICS integration --</option>
                    {integrations.map((i) => (
                      <option key={i.ID} value={i.ID}>
                        {i.Name} ({i.Address})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select an existing ICS integration or add a new URL below.
                  </Form.Text>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>ICS Calendar URL</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://calendar.google.com/calendar/ical/..."
                  value={icsUrl}
                  onChange={(e) => setIcsUrl(e.target.value)}
                  disabled
                />
                <Form.Text className="text-muted">
                  Manual ICS URL entry will be available soon.
                </Form.Text>
              </Form.Group>

              <Button variant="primary" onClick={handleSave} disabled>
                Save Agenda Settings
              </Button>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
