import React, { Component } from "react";
import { withTranslation } from "react-i18next";
import { Container } from "react-bootstrap";

import Configuration from "~/configuration";
import PdfConfig from "~/pdf/config";

/**
 * RecalendarApp - Wrapper que integra el generador recalendar en rmfakecloud.
 *
 * Renderiza el Configuration form completo de recalendar ( con su preview ),
 * listo para que el usuario configure el calendario. Cuando genera el PDF,
 * el handler de descarga lo sube a la tablet via apiService.upload().
 *
 * FIXME: el modulo recalendar original muestra su propia Navigation; aqui
 * la omitimos porque rmfakecloud ya tiene su navbar.
 */
class RecalendarAppBase extends Component {
  constructor(props) {
    super(props);
    this.state = { config: null };
  }

  componentDidMount() {
    // Crear config por defecto
    this.setState({ config: new PdfConfig() });
  }

  render() {
    if (!this.state.config) {
      return null;
    }
    return (
      <Container fluid className="recalendar-container h-100 overflow-auto p-4">
        <Configuration initialState={this.state.config} />
      </Container>
    );
  }
}

const RecalendarApp = withTranslation(["app", "config"])(RecalendarAppBase);

export default RecalendarApp;
