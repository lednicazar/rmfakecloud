import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Alert,
  Spinner,
  Table,
  Badge,
  Modal,
  Row,
  Col,
} from "react-bootstrap";
import { encryptToken } from "../utils/encrypt";
import {
  testConnection,
  fetchProjects,
  fetchProjectTasks,
} from "../utils/vikunja-api";
import { REFRESH_FREQUENCIES } from "../utils/timezone-utils";

export default function TasksTab({ config, onChange }) {
  const [url, setUrl] = useState(config.tasks?.vikunjaUrl || "");
  const [token, setToken] = useState("");
  const [tokenEncrypted, setTokenEncrypted] = useState(
    config.tasks?.vikunjaTokenEncrypted || ""
  );
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(
    config.tasks?.vikunjaProjectId || ""
  );
  const [selectedProjectName, setSelectedProjectName] = useState(
    config.tasks?.vikunjaProjectName || ""
  );
  const [testTasks, setTestTasks] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [frequency, setFrequency] = useState(
    config.tasks?.frequency || "recalendar"
  );

  useEffect(() => {
    if (tokenEncrypted && url) {
      setConnected(true);
    }
  }, []);

  async function handleTestConnection() {
    if (!url || !token) {
      setError("URL and API token are required");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const encrypted = await encryptToken(token);
      await testConnection(url, encrypted);
      setTokenEncrypted(encrypted);
      setConnected(true);

      const projs = await fetchProjects(url, encrypted);
      setProjects(projs);
    } catch (e) {
      setError(e.message);
      setConnected(false);
      setProjects([]);
    } finally {
      setConnecting(false);
    }
  }

  async function handleSelectProject(project) {
    setSelectedProject(project.id);
    setSelectedProjectName(project.title);
    onChange({
      ...config,
      tasks: {
        ...config.tasks,
        vikunjaUrl: url,
        vikunjaTokenEncrypted: tokenEncrypted,
        vikunjaProjectId: project.id,
        vikunjaProjectName: project.title,
        frequency,
      },
    });
  }

  async function handlePreviewTasks() {
    if (!selectedProject) return;
    setPreviewLoading(true);
    setShowPreview(true);
    try {
      const tasks = await fetchProjectTasks(url, tokenEncrypted, selectedProject, 10);
      setTestTasks(tasks);
    } catch (e) {
      setTestTasks([{ title: `Error: ${e.message}`, is_error: true }]);
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleFrequencyChange(freq) {
    setFrequency(freq);
    onChange({
      ...config,
      tasks: {
        ...config.tasks,
        vikunjaUrl: url,
        vikunjaTokenEncrypted: tokenEncrypted,
        vikunjaProjectId: selectedProject,
        vikunjaProjectName: selectedProjectName,
        frequency: freq,
      },
    });
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header>Vikunja Connection</Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Vikunja URL</Form.Label>
            <Form.Control
              type="url"
              placeholder="https://vikunja.tudominio.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setConnected(false);
                setProjects([]);
              }}
            />
            <Form.Text className="text-muted">
              La URL base de tu instancia Vikunja (sin barra al final)
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>API Token</Form.Label>
            <Form.Control
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setConnected(false);
              }}
            />
            <Form.Text className="text-muted">
              En Vikunja: Settings → API Tokens → Create new token. El token se
              almacena encriptado en tu navegador.
            </Form.Text>
          </Form.Group>

          <Button
            variant="primary"
            onClick={handleTestConnection}
            disabled={connecting || !url || !token}
          >
            {connecting ? (
              <>
                <Spinner animation="border" size="sm" /> Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>

          {connected && (
            <Badge bg="success" className="ms-3">
              Connected
            </Badge>
          )}
        </Card.Body>
      </Card>

      {connected && projects.length > 0 && (
        <Card className="mb-3">
          <Card.Header>Select Project</Card.Header>
          <Card.Body>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className={
                      selectedProject === project.id ? "table-primary" : ""
                    }
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSelectProject(project)}
                  >
                    <td>{project.title}</td>
                    <td>
                      <small className="text-muted">
                        {project.description || "-"}
                      </small>
                    </td>
                    <td>
                      {selectedProject === project.id && (
                        <Badge bg="primary">Selected</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {selectedProject && (
        <Card className="mb-3">
          <Card.Header>Task Preview & Settings</Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col md={8}>
                <p className="mb-0">
                  Selected project: <strong>{selectedProjectName}</strong>
                </p>
              </Col>
              <Col md={4} className="text-end">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handlePreviewTasks}
                >
                  Preview Tasks
                </Button>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Refresh Frequency</Form.Label>
              <Form.Select
                value={frequency}
                onChange={(e) => handleFrequencyChange(e.target.value)}
              >
                {REFRESH_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Card.Body>
        </Card>
      )}

      <Modal
        show={showPreview}
        onHide={() => setShowPreview(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Task Preview - {selectedProjectName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" /> Loading tasks...
            </div>
          ) : (
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {testTasks.map((task, idx) => (
                  <tr
                    key={task.id || idx}
                    className={task.is_error ? "table-danger" : ""}
                  >
                    <td>{task.title}</td>
                    <td>
                      {task.priority ? (
                        <Badge
                          bg={
                            task.priority >= 3
                              ? "danger"
                              : task.priority >= 2
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {task.priority}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {task.done ? (
                        <Badge bg="success">Done</Badge>
                      ) : (
                        <Badge bg="warning">Pending</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {testTasks.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">
                      No tasks found in this project
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
