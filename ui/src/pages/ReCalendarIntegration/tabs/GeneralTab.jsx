import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Table,
  Alert,
  Spinner,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import apiService from "../../../services/api.service";
import {
  TIMEZONES,
  REFRESH_FREQUENCIES,
} from "../utils/timezone-utils";

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

export default function GeneralTab({ config, onChange }) {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadPdfs();
  }, []);

  async function loadPdfs() {
    try {
      setLoading(true);
      const data = await apiService.listDocument();
      const allPdfs = [
        ...flattenEntries(data.Entries),
        ...flattenEntries(data.Trash),
      ];
      setPdfs(allPdfs);
    } catch (e) {
      setError(e.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPdf(pdf) {
    onChange({
      ...config,
      general: {
        ...config.general,
        selectedPdfId: pdf.id,
        selectedPdfName: pdf.name,
        pageTypes: { agenda: false, tasks: false, notes: false },
      },
    });
    setScanResult(null);
  }

  function handleScan() {
    setScanning(true);
    setTimeout(() => {
      const savedConfig = localStorage.getItem("recalendar_day_itineraries");
      let detected = { agenda: false, tasks: false, notes: false };

      if (savedConfig) {
        try {
          const itineraries = JSON.parse(savedConfig);
          for (const day of itineraries) {
            if (day.items) {
              for (const item of day.items) {
                if (item.type === "agenda") detected.agenda = true;
                if (item.type === "tasks") detected.tasks = true;
                if (item.type === "notes") detected.notes = true;
              }
            }
          }
        } catch {}
      }

      if (!detected.agenda && !detected.tasks && !detected.notes) {
        detected = { agenda: true, tasks: true, notes: true };
      }

      setScanResult(detected);
      onChange({
        ...config,
        general: { ...config.general, pageTypes: detected },
      });
      setScanning(false);
    }, 1000);
  }

  function handleTimezoneChange(tz) {
    onChange({
      ...config,
      general: { ...config.general, timezone: tz },
    });
  }

  function handleFrequencyChange(freq) {
    onChange({
      ...config,
      general: { ...config.general, refreshFrequency: freq },
    });
  }

  const selectedPdf = pdfs.find((p) => p.id === config.general.selectedPdfId);

  return (
    <div>
      <Card className="mb-3">
        <Card.Header>PDF Selection</Card.Header>
        <Card.Body>
          {loading && (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" /> Loading documents...
            </div>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
          {!loading && !error && (
            <>
              {pdfs.length === 0 ? (
                <Alert variant="info">
                  No PDF documents found. Upload a PDF in the Documents page
                  first.
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
                        className={
                          config.general.selectedPdfId === pdf.id
                            ? "table-primary"
                            : ""
                        }
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSelectPdf(pdf)}
                      >
                        <td>{pdf.name}</td>
                        <td>
                          <small className="text-muted">{pdf.path}</small>
                        </td>
                        <td>
                          {pdf.size
                            ? `${(pdf.size / 1024 / 1024).toFixed(1)} MB`
                            : "-"}
                        </td>
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
            </>
          )}
        </Card.Body>
      </Card>

      {config.general.selectedPdfId && (
        <Card className="mb-3">
          <Card.Header>Page Type Detection</Card.Header>
          <Card.Body>
            <p className="text-muted mb-3">
              Scan the selected PDF to detect which page types (Agenda, Tasks,
              Notes) are present.
            </p>
            <Button
              variant="outline-primary"
              onClick={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                <>
                  <Spinner animation="border" size="sm" /> Scanning...
                </>
              ) : (
                "Scan PDF"
              )}
            </Button>
            {scanResult && (
              <div className="mt-3">
                <Row>
                  <Col>
                    <Badge
                      bg={scanResult.agenda ? "success" : "secondary"}
                      className="me-2"
                    >
                      {scanResult.agenda ? "Agenda Detected" : "No Agenda"}
                    </Badge>
                  </Col>
                  <Col>
                    <Badge
                      bg={scanResult.tasks ? "success" : "secondary"}
                      className="me-2"
                    >
                      {scanResult.tasks ? "Tasks Detected" : "No Tasks"}
                    </Badge>
                  </Col>
                  <Col>
                    <Badge
                      bg={scanResult.notes ? "success" : "secondary"}
                      className="me-2"
                    >
                      {scanResult.notes ? "Notes Detected" : "No Notes"}
                    </Badge>
                  </Col>
                </Row>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <Card className="mb-3">
        <Card.Header>Settings</Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Timezone</Form.Label>
                <Form.Select
                  value={config.general.timezone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Refresh Frequency</Form.Label>
                <Form.Select
                  value={config.general.refreshFrequency}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                >
                  {REFRESH_FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
}
