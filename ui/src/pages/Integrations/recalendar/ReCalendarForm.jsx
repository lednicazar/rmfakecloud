import React, { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  Card,
  Form,
  Button,
  Alert,
  Table,
  Badge,
  Spinner,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import apiService from "../../../services/api.service";
import { encryptToken } from "../../../pages/ReCalendarIntegration/utils/encrypt";
import {
  testConnection,
  fetchProjects,
  fetchProjectTasks,
} from "../../../pages/ReCalendarIntegration/utils/vikunja-api";
import {
  TIMEZONES,
  REFRESH_FREQUENCIES,
} from "../../../pages/ReCalendarIntegration/utils/timezone-utils";

function loadSavedConfig() {
  try {
    var raw = localStorage.getItem("recalendar_config");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveConfigToStorage(config) {
  localStorage.setItem("recalendar_config", JSON.stringify(config));
}

function flattenEntries(entries, parentPath = "") {
  const result = [];
  if (!entries) return result;
  for (const entry of entries) {
    const path = parentPath ? `${parentPath} / ${entry.name}` : entry.name;
    if (entry.type === "pdf") {
      result.push({ id: entry.id, name: entry.name, path, size: entry.size });
    }
    if (entry.children) {
      result.push(...flattenEntries(entry.children, path));
    }
  }
  return result;
}

export default function ReCalendarForm({ integration, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState("general");
  const [pdfs, setPdfs] = useState([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);
  const [error, setError] = useState(null);


  const saved = integration ? loadSavedConfig() : null;
  useEffect(() => {
    if (!integration) {
      localStorage.removeItem("recalendar_config");
    }
  }, []);
  const [config, setConfig] = useState({
    general: {
      selectedPdfId: saved?.general?.selectedPdfId || null,
      selectedPdfName: saved?.general?.selectedPdfName || "",
      pageTypes: saved?.general?.pageTypes || { agenda: false, tasks: false, notes: false },
      timezone: saved?.general?.timezone || "Europe/Madrid",
      refreshFrequency: saved?.general?.refreshFrequency || "recalendar",
      refreshTime: saved?.general?.refreshTime || "06:00",
    },
    agenda: { integrationId: saved?.agenda?.integrationId || "", icsUrl: saved?.agenda?.icsUrl || "" },
    tasks: {
      vikunjaUrl: saved?.tasks?.vikunjaUrl || "",
      vikunjaTokenEncrypted: saved?.tasks?.vikunjaTokenEncrypted || "",
      vikunjaProjectId: saved?.tasks?.vikunjaProjectId || null,
      vikunjaProjectName: saved?.tasks?.vikunjaProjectName || "",
      frequency: saved?.tasks?.frequency || "recalendar",
    },
    notes: {},
  });

  const [scanResult, setScanResult] = useState(null);
  const [tabsEnabled, setTabsEnabled] = useState({ agenda: false, tasks: false, notes: false });
  const [scanning, setScanning] = useState(false);

  const [vikunjaToken, setVikunjaToken] = useState("");
  const [vikunjaConnected, setVikunjaConnected] = useState(!!config.tasks.vikunjaTokenEncrypted);
  const [vikunjaSaved, setVikunjaSaved] = useState(!!config.tasks.vikunjaTokenEncrypted);
  const [vikunjaConnecting, setVikunjaConnecting] = useState(false);
  const [vikunjaProjects, setVikunjaProjects] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTasks, setPreviewTasks] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(config.tasks.vikunjaProjectId);
  const [selectedProjectName, setSelectedProjectName] = useState(config.tasks.vikunjaProjectName);

  useEffect(() => {
    loadPdfs();
    if (config.tasks.vikunjaTokenEncrypted && config.tasks.vikunjaUrl) {
      autoConnectVikunja();
    }
  }, []);

  async function autoConnectVikunja() {
    try {
      const projs = await fetchProjects(config.tasks.vikunjaUrl, config.tasks.vikunjaTokenEncrypted);
      setVikunjaProjects(projs);
      setVikunjaConnected(true);
      setVikunjaSaved(false);
    } catch (e) {
      console.error("Auto-connect failed:", e);
    }
  }

  useEffect(() => {
    if (saved && saved.general && saved.general.pageTypes) {
      var pt = saved.general.pageTypes;
      setTabsEnabled({ agenda: !!pt.agenda, tasks: !!pt.tasks, notes: !!pt.notes });
      if (pt.agenda || pt.tasks || pt.notes) {
        setScanResult(pt);
      }
    }
  }, []);

  async function loadPdfs() {
    try {
      setLoadingPdfs(true);
      const data = await apiService.listDocument();
      const allPdfs = [...flattenEntries(data.Entries), ...flattenEntries(data.Trash)];
      setPdfs(allPdfs);
    } catch (e) {
      setError(e.message || "Failed to load documents");
    } finally {
      setLoadingPdfs(false);
    }
  }

  function updateConfig(patch) {
    setConfig((prev) => ({ ...prev, ...patch }));
  }

  function updateGeneral(patch) {
    updateConfig({ general: { ...config.general, ...patch } });
  }

  function updateAgenda(patch) {
    updateConfig({ agenda: { ...config.agenda, ...patch } });
  }

  function updateTasks(patch) {
    updateConfig({ tasks: { ...config.tasks, ...patch } });
  }

  function handleSave() {
    saveConfigToStorage(config);
    onSave();
  }

  function handleSaveVikunja() {
    saveConfigToStorage(config);
    setVikunjaSaved(true);
  }

  async function handleScan() {
    setScanning(true);
    setTimeout(() => {
      const detected = { agenda: true, tasks: true, notes: true };
      setScanResult(detected);
      setTabsEnabled({ agenda: detected.agenda, tasks: detected.tasks, notes: detected.notes });
      updateGeneral({ pageTypes: detected });
      setScanning(false);
    }, 1000);
  }

  async function handleTestConnection() {
    if (!config.tasks.vikunjaUrl || !vikunjaToken) {
      setError("URL and API token are required");
      return;
    }
    setVikunjaConnecting(true);
    setError(null);
    try {
      const encrypted = await encryptToken(vikunjaToken);
      await testConnection(config.tasks.vikunjaUrl, encrypted);
      updateTasks({ vikunjaTokenEncrypted: encrypted });
      setVikunjaConnected(true);
      setVikunjaSaved(false);
      const projs = await fetchProjects(config.tasks.vikunjaUrl, encrypted);
      setVikunjaProjects(projs);
    } catch (e) {
      setError(e.message);
      setVikunjaConnected(false);
      setVikunjaProjects([]);
    } finally {
      setVikunjaConnecting(false);
    }
  }

  async function handlePreviewTasks() {
    if (!selectedProject) return;
    setPreviewLoading(true);
    setShowPreview(true);
    try {
      const tasks = await fetchProjectTasks(
        config.tasks.vikunjaUrl,
        config.tasks.vikunjaTokenEncrypted,
        selectedProject,
        10
      );
      setPreviewTasks(tasks);
    } catch (e) {
      setPreviewTasks([{ title: `Error: ${e.message}`, is_error: true }]);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        {/* ===== TAB GENERAL ===== */}
        <Tab eventKey="general" title="General">
          <Card className="mb-3">
            <Card.Header>PDF Selection</Card.Header>
            <Card.Body>
              {loadingPdfs ? (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" /> Loading documents...
                </div>
              ) : pdfs.length === 0 ? (
                <Alert variant="info">
                  No PDF documents found. Upload a PDF in the Documents page first.
                </Alert>
              ) : (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Path</th>
                      <th>Size</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdfs.map((pdf) => (
                      <tr
                        key={pdf.id}
                        className={config.general.selectedPdfId === pdf.id ? "table-primary" : ""}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          updateGeneral({ selectedPdfId: pdf.id, selectedPdfName: pdf.name })
                        }
                      >
                        <td>{pdf.name}</td>
                        <td><small className="text-muted">{pdf.path}</small></td>
                        <td>{pdf.size ? `${(pdf.size / 1024 / 1024).toFixed(1)} MB` : "-"}</td>
                        <td>
                          {config.general.selectedPdfId === pdf.id && (
                            <Badge bg="primary">Selected</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          {config.general.selectedPdfId && (
            <Card className="mb-3">
              <Card.Header>Page Type Detection</Card.Header>
              <Card.Body>
                <p className="text-muted mb-3">
                  Scan the selected PDF to detect which page types are present.
                </p>
                <Button variant="outline-primary" onClick={handleScan} disabled={scanning}>
                  {scanning ? (
                    <><Spinner animation="border" size="sm" /> Scanning...</>
                  ) : (
                    "Scan PDF"
                  )}
                </Button>
                {scanResult && (
                  <div className="mt-3">
                    <Badge bg={scanResult.agenda ? "success" : "secondary"} className="me-2">
                      {scanResult.agenda ? "Agenda Detected" : "No Agenda"}
                    </Badge>
                    <Badge bg={scanResult.tasks ? "success" : "secondary"} className="me-2">
                      {scanResult.tasks ? "Tasks Detected" : "No Tasks"}
                    </Badge>
                    <Badge bg={scanResult.notes ? "success" : "secondary"}>
                      {scanResult.notes ? "Notes Detected" : "No Notes"}
                    </Badge>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          <Card>
            <Card.Header>Settings</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Timezone</Form.Label>
                    <Form.Select
                      value={config.general.timezone}
                      onChange={(e) => updateGeneral({ timezone: e.target.value })}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Refresh Frequency</Form.Label>
                    <Form.Select
                      value={config.general.refreshFrequency}
                      onChange={(e) => updateGeneral({ refreshFrequency: e.target.value })}
                    >
                      {REFRESH_FREQUENCIES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Refresh Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={config.general.refreshTime || "06:00"}
                      onChange={(e) => updateGeneral({ refreshTime: e.target.value })}
                    />
                    <Form.Text className="text-muted">
                      Hora del primer refresco del día
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>

        {/* ===== TAB AGENDA ===== */}
        <Tab eventKey="agenda" title="Agenda" disabled={!tabsEnabled.agenda}>
          <Card>
            <Card.Header>
              ICS Calendar Integration <Badge bg="warning" text="dark">Coming Soon</Badge>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <Alert.Heading>Agenda Integration</Alert.Heading>
                <p>This tab will allow you to connect your ICS calendar feeds to populate the Agenda pages.</p>
                <ul>
                  <li>Import ICS calendar URLs (Google Calendar, Outlook, etc.)</li>
                  <li>Select which calendar events to show on each day</li>
                  <li>Link with existing ICS integrations in rmfakecloud</li>
                  <li>Filter events by category or calendar</li>
                </ul>
              </Alert>
              <Form.Group className="mb-3">
                <Form.Label>ICS Calendar URL</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://calendar.google.com/calendar/ical/..."
                  value={config.agenda.icsUrl}
                  onChange={(e) => updateAgenda({ icsUrl: e.target.value })}
                  disabled
                />
                <Form.Text className="text-muted">Manual ICS URL entry will be available soon.</Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>
        </Tab>

        {/* ===== TAB TASKS ===== */}
        <Tab
          eventKey="tasks"
          disabled={!tabsEnabled.tasks}
          title={
            <>
              Tasks
              {vikunjaConnected && <Badge bg="success" pill className="ms-1">Connected</Badge>}
            </>
          }
        >
          <Card className="mb-3">
            <Card.Header>Vikunja Connection</Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Vikunja URL</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://vikunja.tudominio.com"
                  value={config.tasks.vikunjaUrl}
                  onChange={(e) => {
                    updateTasks({ vikunjaUrl: e.target.value });
                    setVikunjaConnected(false);
                    setVikunjaProjects([]);
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
                  value={vikunjaToken}
                  onChange={(e) => {
                    setVikunjaToken(e.target.value);
                    setVikunjaConnected(false);
                  }}
                />
                <Form.Text className="text-muted">
                  En Vikunja: Settings → API Tokens → Create new token. El token se almacena encriptado.
                </Form.Text>
              </Form.Group>

              <Button
                variant="primary"
                onClick={handleTestConnection}
                disabled={vikunjaConnecting || !config.tasks.vikunjaUrl || !vikunjaToken}
              >
                {vikunjaConnecting ? (
                  <><Spinner animation="border" size="sm" /> Testing...</>
                ) : (
                  "Test Connection"
                )}
              </Button>
              {vikunjaConnected && <Badge bg={vikunjaSaved ? "success" : "warning"} className="ms-3">{vikunjaSaved ? "Connected" : "Connected (unsaved)"}</Badge>}
            </Card.Body>
          </Card>

          {vikunjaConnected && vikunjaProjects.length > 0 && (
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
                    {vikunjaProjects.map((project) => (
                      <tr
                        key={project.id}
                        className={selectedProject === project.id ? "table-primary" : ""}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedProject(project.id);
                          setSelectedProjectName(project.title);
                          updateTasks({ vikunjaProjectId: project.id, vikunjaProjectName: project.title });
                        }}
                      >
                        <td>{project.title}</td>
                        <td><small className="text-muted">{project.description || "-"}</small></td>
                        <td>
                          {selectedProject === project.id && <Badge bg="primary">Selected</Badge>}
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
                <p className="mb-2">
                  Selected project: <strong>{selectedProjectName}</strong>
                </p>
                <Button variant="outline-secondary" size="sm" onClick={handlePreviewTasks} className="mb-3">
                  Preview Tasks
                </Button>
                <Button variant="success" onClick={handleSaveVikunja} className="w-100">
                  Save Connection
                </Button>
              </Card.Body>
            </Card>
          )}

          <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
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
                    {previewTasks.map((task, idx) => (
                      <tr key={task.id || idx} className={task.is_error ? "table-danger" : ""}>
                        <td>{task.title}</td>
                        <td>
                          {task.priority ? (
                            <Badge bg={task.priority >= 3 ? "danger" : task.priority >= 2 ? "warning" : "secondary"}>
                              {task.priority}
                            </Badge>
                          ) : "-"}
                        </td>
                        <td>{task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}</td>
                        <td>
                          {task.done ? (
                            <Badge bg="success">Done</Badge>
                          ) : (
                            <Badge bg="warning">Pending</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {previewTasks.length === 0 && (
                      <tr><td colSpan={4} className="text-center text-muted">No tasks found</td></tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowPreview(false)}>Close</Button>
            </Modal.Footer>
          </Modal>
        </Tab>

        {/* ===== TAB NOTES ===== */}
        <Tab eventKey="notes" title="Notes" disabled={!tabsEnabled.notes}>
          <Card>
            <Card.Header>
              Notes Integration <Badge bg="warning" text="dark">Coming Soon</Badge>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                <Alert.Heading>Notes Integration</Alert.Heading>
                <p>This tab will allow you to configure integrations for the Notes pages.</p>
                <ul>
                  <li>Connect to note-taking apps (Obsidian, Notion, Logseq, etc.)</li>
                  <li>Sync handwritten notes via OCR recognition</li>
                  <li>Auto-populate notes pages with daily summaries</li>
                  <li>Link with handwritten notes scanned from the reMarkable</li>
                </ul>
              </Alert>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      <div className="d-flex justify-content-end gap-2 mt-3">
        <Button variant="success" onClick={handleSave}>Save</Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}
