import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

type MailSendOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
};

export interface InstrumentAssignmentEmailPayload {
  to: string;
  patientName: string;
  instrumentName: string;
  assignedAt?: string | Date | null;
  validUntil?: string | Date | null;
}

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  async sendInstrumentAssignmentEmail(
    payload: InstrumentAssignmentEmailPayload,
  ): Promise<boolean> {
    const { to, patientName, instrumentName, assignedAt, validUntil } = payload;

    const assignedLabel = this.formatDateTime(assignedAt);
    const validUntilLabel = this.formatDateTime(validUntil);

    const lines = [
      `Hola ${patientName},`,
      '',
      `Se te ha asignado el instrumento "${instrumentName}".`,
      assignedLabel ? `Fecha de asignación: ${assignedLabel}.` : null,
      validUntilLabel ? `Fecha límite: ${validUntilLabel}.` : null,
      '',
      'Ingresa a la plataforma para revisarlo y completarlo a la brevedad.',
      '',
      'Saludos,',
      'Equipo Holístico Hoffmann',
    ].filter((line): line is string => Boolean(line));

    const safePatientName = this.escapeHtml(patientName);
    const safeInstrumentName = this.escapeHtml(instrumentName);
    const htmlParts = [
      `<p>Hola ${safePatientName},</p>`,
      `<p>Se te ha asignado el instrumento <strong>${safeInstrumentName}</strong>.</p>`,
      assignedLabel
        ? `<p><strong>Fecha de asignación:</strong> ${this.escapeHtml(assignedLabel)}</p>`
        : '',
      validUntilLabel
        ? `<p><strong>Fecha límite:</strong> ${this.escapeHtml(validUntilLabel)}</p>`
        : '',
      '<p>Ingresa a la plataforma para revisarlo y completarlo a la brevedad.</p>',
      '<p>Saludos,<br/>Equipo Holístico Hoffmann</p>',
    ].filter(Boolean);

    const subject = `Nuevo instrumento asignado: ${instrumentName}`;

    return this.sendMail({
      to,
      subject,
      text: lines.join('\n'),
      html: htmlParts.join(''),
    });
  }

  async sendMail(options: MailSendOptions): Promise<boolean> {
    const transporter = await this.resolveTransporter();
    if (!transporter) {
      this.logger.warn(
        `No se pudo inicializar el transportador de correo. Se omite el envío a ${options.to}.`,
      );
      return false;
    }

    const from = options.from ?? this.resolveDefaultSender();

    try {
      await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Error al enviar correo a ${options.to}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }

  private async resolveTransporter(): Promise<Transporter | null> {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.MAIL_HOST?.trim();
    const user = process.env.MAIL_USERNAME?.trim();
    const pass = process.env.MAIL_PASSWORD?.trim();
    const portRaw = process.env.MAIL_PORT?.toString().trim();
    const encryption = process.env.MAIL_ENCRYPTION?.trim().toLowerCase() ?? '';

    if (!host || !user || !pass) {
      this.logger.warn(
        'Configuración de correo incompleta. Define MAIL_HOST, MAIL_USERNAME y MAIL_PASSWORD para habilitar el envío de emails.',
      );
      return null;
    }

    const port = Number.isFinite(Number(portRaw)) ? Number(portRaw) : 587;
    const secure = encryption === 'ssl' || encryption === 'smtps';

    const transportOptions: SMTPTransport.Options = {
      host,
      port,
      secure,
      auth: { user, pass },
    };

    if (encryption === 'tls') {
      transportOptions.secure = false;
      transportOptions.requireTLS = true;
    }

    try {
      this.transporter = nodemailer.createTransport(transportOptions);
      return this.transporter;
    } catch (error) {
      this.logger.error(
        'No se pudo crear el transportador de correo',
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  private resolveDefaultSender(): string {
    const from = process.env.MAIL_FROM?.trim();
    if (from) {
      return from;
    }

    const username = process.env.MAIL_USERNAME?.trim();
    if (username) {
      return username;
    }

    return 'no-reply@holisticohoffmann.local';
  }

  private formatDateTime(value?: string | Date | null): string | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    try {
      return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      this.logger.warn(
        'No se pudo formatear la fecha de correo. Se usa ISO8601 como respaldo.',
      );
      return date.toISOString();
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
