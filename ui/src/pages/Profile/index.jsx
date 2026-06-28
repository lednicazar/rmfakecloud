import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useAuthState } from "../../common/useAuthContext";

import ResetPassword from "./ResetPassword";

const LANGUAGE_KEY = "rmfakecloud_language";

function LanguageSelector() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem(LANGUAGE_KEY) || "es";
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(LANGUAGE_KEY, lang);
    setSaved(true);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <Form.Group controlId="language" className="mb-3">
      <Form.Label><strong>Idioma / Language</strong></Form.Label>
      <div className="d-flex gap-2 align-items-center">
        <Form.Select
          value={lang}
          onChange={(e) => { setLang(e.target.value); setSaved(false); }}
          style={{ width: 200 }}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </Form.Select>
        <Button variant="primary" onClick={handleSave}>
          {saved ? "✓ Guardado" : "Guardar"}
        </Button>
      </div>
      <Form.Text className="text-muted">
        Se aplicará al recargar la página
      </Form.Text>
    </Form.Group>
  );
}

const Profile = () => {
  const { state: { user } } = useAuthState();
  return (
    <Container fluid>
      <Stack>
        <div>
          {user.scopes === "sync15" && (<span>Using sync 15</span>)}
        </div>
        <LanguageSelector />
        <div>
          <ResetPassword />
        </div>
      </Stack>
    </Container>
  );
};

export default Profile;
