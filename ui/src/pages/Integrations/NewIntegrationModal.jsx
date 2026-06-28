import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import { Button, Card, Alert } from "react-bootstrap";
import apiService from "../../services/api.service";
import ReCalendarForm from "./recalendar/ReCalendarForm";

export default function IntegrationProfileModal(params) {
  const { onSave, onClose } = params;

  const [formErrors, setFormErrors] = useState({});
  const [integrationForm, setIntegrationForm] = useState({
    name: "",
    provider: "recalendar",
  });

  function handleChange({ target }) {
    setIntegrationForm({ ...integrationForm, [target.name]: target.value });
  }

  function formIsValid() {
    const _errors = {};
    if (!integrationForm.name) _errors.error = "name is required";
    if (!integrationForm.provider) _errors.error = "provider is required";
    if (integrationForm.provider === "vikunja") {
      if (!integrationForm.address) _errors.error = "URL is required";
      if (!integrationForm.accesstoken) _errors.error = "API token is required";
    }
    setFormErrors(_errors);
    return Object.keys(_errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!formIsValid()) return;
    try {
      await apiService.createintegration(integrationForm);
      onSave();
    } catch (e) {
      setFormErrors({ error: e.toString() });
    }
  }

  async function handleRecalendarSave() {
    try {
      await apiService.createintegration(integrationForm);
      onSave();
    } catch (e) {
      setFormErrors({ error: e.toString() });
    }
  }

  if (integrationForm.provider === "recalendar") {
    return (
      <Card>
        <Card.Header>
          <span>New Integration</span>
        </Card.Header>
        <Card.Body>
          <Alert variant="danger" hidden={!formErrors.error}>
            <Alert.Heading>An Error Occurred</Alert.Heading>
            <div style={{whiteSpace: "pre-wrap"}}>
              {formErrors.error}
            </div>
          </Alert>

          <Form.Label>Integration Name</Form.Label>
          <Form.Control
            placeholder="Integration name"
            value={integrationForm.name}
            name="name"
            autoFocus
            onChange={handleChange}
          />

          <Form.Label className="mt-2">Provider</Form.Label>
          <Form.Select
            name="provider"
            value={integrationForm.provider}
            onChange={handleChange}
            className="mb-3"
          >
            <option value="recalendar">ReCalendar</option>
            <option value="localfs">Directory in file system</option>
            <option value="ftp">FTP</option>
            <option value="webdav">WebDAV</option>
            <option value="dropbox">Dropbox</option>
            <option value="webhook">Messaging webhook</option>
            <option value="ics">ICS Calendar</option>
          </Form.Select>

          {!integrationForm.name ? (
            <Alert variant="info">
              Enter an integration name above to configure ReCalendar settings.
            </Alert>
          ) : (
            <ReCalendarForm onSave={handleRecalendarSave} onClose={onClose} />
          )}
        </Card.Body>
      </Card>
    );
  }

  return (
    <Form onSubmit={handleSubmit} autoComplete="off">
      <Card>
        <Card.Header>
          <span>New Integration</span>
        </Card.Header>
        <Card.Body>
          <Alert variant="danger" hidden={!formErrors.error}>
            <Alert.Heading>An Error Occurred</Alert.Heading>
            <div style={{whiteSpace: "pre-wrap"}}>
              {formErrors.error}
            </div>
          </Alert>

          <Form.Label>Name</Form.Label>
          <Form.Control
            placeholder="Integration name"
            value={integrationForm.name}
            name="name"
            autoFocus
            onChange={handleChange}
          />

          <Form.Label>Provider</Form.Label>
          <Form.Select
            name="provider"
            value={integrationForm.provider}
            onChange={handleChange}
            className="mb-1"
          >
            <option value="recalendar">ReCalendar</option>
            <option value="localfs">Directory in file system</option>
            <option value="ftp">FTP</option>
            <option value="webdav">WebDAV</option>
            <option value="dropbox">Dropbox</option>
            <option value="webhook">Messaging webhook</option>
            <option value="ics">ICS Calendar</option>
          </Form.Select>

          {integrationForm.provider === "vikunja" && (
            <>
              <Form.Label>Vikunja URL</Form.Label>
              <Form.Control
                placeholder="https://vikunja.tudominio.com"
                value={integrationForm.address}
                name="address"
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                La URL base de tu instancia Vikunja (sin barra al final)
              </Form.Text>

              <Form.Label className="mt-3">API Token</Form.Label>
              <Form.Control
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                value={integrationForm.accesstoken}
                name="accesstoken"
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                En Vikunja: Settings → API Tokens → Create new token. Copia el token completo.
              </Form.Text>

              <Form.Label className="mt-3">Frecuencia de actualización</Form.Label>
              <Form.Select
                name="endpoint"
                value={integrationForm.endpoint || "recalendar"}
                onChange={handleChange}
              >
                <option value="recalendar">Con ReCalendar (al generar PDF)</option>
                <option value="1h">Cada 1 hora</option>
                <option value="24h">Cada 24 horas</option>
              </Form.Select>
              <Form.Text className="text-muted">
                "Con ReCalendar" descarga las tareas solo cuando generas el calendario.
              </Form.Text>
            </>
          )}

          {integrationForm.provider === "ics" && (
            <>
              <Form.Label>ICS URL</Form.Label>
              <Form.Control
                placeholder="https://example.com/calendar.ics"
                value={integrationForm.address}
                name="address"
                onChange={handleChange}
              />
              <Form.Check
                name="insecure"
                checked={integrationForm.insecure}
                onChange={({ target }) => setIntegrationForm({ ...integrationForm, [target.name]: target.checked })}
                label="Ignore TLS certificate errors"
              />
            </>
          )}

          {(integrationForm.provider === "webdav" || integrationForm.provider === "ftp") && (
            <>
              <Form.Label>Address</Form.Label>
              <Form.Control
                placeholder="Server URL"
                value={integrationForm.address}
                name="address"
                onChange={handleChange}
              />
            </>
          )}
          {(integrationForm.provider === "webdav" || integrationForm.provider === "ftp") && (
            <>
              <Form.Label>Username</Form.Label>
              <Form.Control
                placeholder="Username"
                value={integrationForm.username}
                name="username"
                onChange={handleChange}
              />
            </>
          )}
          {(integrationForm.provider === "webdav" || integrationForm.provider === "ftp") && (
            <>
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={integrationForm.password}
                name="password"
                onChange={handleChange}
              />
            </>
          )}

          {integrationForm.provider === "ftp" && (
            <Form.Check
              name="activetransfers"
              checked={integrationForm.activetransfers}
              onChange={({ target }) => setIntegrationForm({ ...integrationForm, [target.name]: target.checked })}
              label="Use actives transfers"
            />
          )}

          {integrationForm.provider === "localfs" && (
            <>
              <Form.Label>Path</Form.Label>
              <Form.Control
                placeholder="Path"
                value={integrationForm.path}
                name="path"
                onChange={handleChange}
              />
            </>
          )}

          {integrationForm.provider === "dropbox" && (
            <>
              <Form.Label>Access Token</Form.Label>
              <Form.Control
                placeholder="Access Token"
                value={integrationForm.accesstoken}
                name="accesstoken"
                onChange={handleChange}
              />
            </>
          )}

          {integrationForm.provider === "webhook" && (
            <>
              <Form.Label>Endpoint</Form.Label>
              <Form.Control
                placeholder="https://automation.domain.tld/webhook/0123-456789-abc"
                value={integrationForm.endpoint}
                name="endpoint"
                onChange={handleChange}
              />
            </>
          )}
        </Card.Body>
        <Card.Footer style={{ display: "flex", gap: "15px" }}>
          <Button variant="primary" type="submit">
            Save
          </Button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </Card.Footer>
      </Card>
    </Form>
  );
}
