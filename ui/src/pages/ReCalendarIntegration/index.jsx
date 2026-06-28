import React, { useState, useEffect } from "react";
import { Container, Tab, Tabs, Card, Button, Alert, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import GeneralTab from "./tabs/GeneralTab";
import AgendaTab from "./tabs/AgendaTab";
import TasksTab from "./tabs/TasksTab";
import NotesTab from "./tabs/NotesTab";
import { loadConfig, saveConfig, getDefaultConfig } from "./utils/timezone-utils";

export default function ReCalendarIntegration() {
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  function handleConfigChange(newConfig) {
    setConfig(newConfig);
  }

  function handleSave() {
    saveConfig(config);
    toast.success("ReCalendar integration settings saved!");
  }

  if (!config) {
    return null;
  }

  const hasSelectedPdf = !!config.general.selectedPdfId;
  const hasVikunja = !!config.tasks?.vikunjaProjectId;

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">ReCalendar Integration</h3>
          <p className="text-muted mb-0">
            Configure how your ReCalendar PDF integrates with external services
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {hasSelectedPdf && (
            <Badge bg="primary" className="me-2">
              PDF: {config.general.selectedPdfName}
            </Badge>
          )}
          {hasVikunja && (
            <Badge bg="success" className="me-2">
              Vikunja: {config.tasks.vikunjaProjectName}
            </Badge>
          )}
          <Button variant="success" onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >
        <Tab
          eventKey="general"
          title={
            <>
              General
              {hasSelectedPdf && (
                <Badge bg="success" pill className="ms-1">
                  {config.general.selectedPdfName}
                </Badge>
              )}
            </>
          }
        >
          <GeneralTab config={config} onChange={handleConfigChange} />
        </Tab>

        <Tab
          eventKey="agenda"
          title={
            <>
              Agenda
              {config.agenda?.integrationId && (
                <Badge bg="info" pill className="ms-1">
                  ICS
                </Badge>
              )}
            </>
          }
        >
          <AgendaTab config={config} onChange={handleConfigChange} />
        </Tab>

        <Tab
          eventKey="tasks"
          title={
            <>
              Tasks
              {hasVikunja && (
                <Badge bg="success" pill className="ms-1">
                  Vikunja
                </Badge>
              )}
            </>
          }
        >
          <TasksTab config={config} onChange={handleConfigChange} />
        </Tab>

        <Tab eventKey="notes" title="Notes">
          <NotesTab config={config} onChange={handleConfigChange} />
        </Tab>
      </Tabs>
    </Container>
  );
}
