import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import webpush from 'web-push';
import { logger } from './logger';

const prisma = new PrismaClient();
const prismaAny = prisma as any;

// ─── VAPID / Web Push setup ──────────────────────────────────────────────────

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL;

  if (!publicKey || !privateKey || !email) {
    logger.warn('Web Push non configuré : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY ou VAPID_EMAIL manquant.');
    return false;
  }

  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

// Appeler au démarrage du module
ensureVapid();

// ─── SMTP / Nodemailer setup ─────────────────────────────────────────────────

let smtpTransporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST;
  if (!host) {
    logger.warn('Nodemailer non configuré : SMTP_HOST manquant.');
    return null;
  }

  smtpTransporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });

  return smtpTransporter;
}

// ─── Email HTML template ─────────────────────────────────────────────────────

function buildEmailHtml(titre: string, corps: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titre}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1e40af;padding:24px 32px;">
              <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">SGH</span>
              <span style="color:#93c5fd;font-size:13px;margin-left:12px;">Système de Gestion des Hypothèques</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#1e3a8a;margin:0 0 16px;">${titre}</h2>
              <div style="color:#374151;font-size:15px;line-height:1.6;">
                ${corps}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
              <span style="color:#6b7280;font-size:12px;">
                Ce message est généré automatiquement par SGH. Merci de ne pas y répondre directement.
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateNotificationData {
  userId?: number | null;
  type: string;
  titre: string;
  message: string;
  entiteType?: string | null;
  entiteId?: number | null;
}

// ─── Core CRUD ───────────────────────────────────────────────────────────────

/**
 * Crée une notification persistée en base pour un utilisateur donné.
 */
export async function createNotification(data: CreateNotificationData): Promise<any> {
  try {
    const notif = await prismaAny.notification.create({
      data: {
        userId: data.userId ?? null,
        type: data.type,
        titre: data.titre,
        message: data.message,
        entiteType: data.entiteType ?? null,
        entiteId: data.entiteId ?? null,
        lu: false,
      },
    });
    return notif;
  } catch (err) {
    logger.error('notification.createNotification error:', err);
    throw err;
  }
}

/**
 * Crée une notification broadcast (userId = null) visible par tous les utilisateurs.
 */
export async function createBroadcast(data: Omit<CreateNotificationData, 'userId'>): Promise<any> {
  return createNotification({ ...data, userId: null });
}

// ─── Email ───────────────────────────────────────────────────────────────────

/**
 * Envoie un email via SMTP. Ne fait rien si SMTP_HOST non configuré.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    logger.info(`sendEmail: SMTP non configuré, email à ${to} ignoré (sujet: ${subject})`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@sgh.sn',
      to,
      subject,
      html,
    });
    logger.info(`Email envoyé à ${to} — ${subject}`);
  } catch (err) {
    logger.error(`sendEmail error (destinataire: ${to}):`, err);
  }
}

// ─── Web Push ────────────────────────────────────────────────────────────────

/**
 * Envoie une notification web push à toutes les subscriptions d'un utilisateur.
 */
export async function sendWebPush(userId: number, payload: object): Promise<void> {
  if (!ensureVapid()) {
    logger.info(`sendWebPush: VAPID non configuré, push pour userId=${userId} ignoré.`);
    return;
  }

  let subscriptions: any[];
  try {
    subscriptions = await prismaAny.webPushSubscription.findMany({ where: { userId } });
  } catch (err) {
    logger.error('sendWebPush: impossible de récupérer les subscriptions:', err);
    return;
  }

  if (!subscriptions.length) return;

  const payloadStr = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(async (sub: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payloadStr,
        );
      } catch (err: any) {
        // 410 Gone / 404 → subscription expirée, on supprime
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await prismaAny.webPushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
          logger.info(`WebPush: subscription expirée supprimée (userId=${userId})`);
        } else {
          logger.error(`WebPush: erreur envoi à userId=${userId}:`, err);
        }
      }
    }),
  );
}

// ─── Notifications métier ─────────────────────────────────────────────────────

/**
 * Notifie les RESPONSABLE_RISQUES et ADMIN d'un shortfall sur une hypothèque.
 */
export async function notifyShortfall(hypotheque: any): Promise<void> {
  const titre = `Shortfall détecté — ${hypotheque.numeroPret}`;
  const message = `Insuffisance de couverture pour ${hypotheque.nomClient} (${hypotheque.numeroPret}). Le solde prêt dépasse la valeur nette de couverture.`;
  const htmlCorps = `
    <p>Une insuffisance de couverture (shortfall) a été détectée sur le dossier suivant :</p>
    <ul>
      <li><strong>Client :</strong> ${hypotheque.nomClient}</li>
      <li><strong>N° Prêt :</strong> ${hypotheque.numeroPret}</li>
      <li><strong>Solde prêt :</strong> ${Number(hypotheque.soldePret).toLocaleString('fr-FR')} FCFA</li>
    </ul>
    <p>Veuillez prendre les mesures correctives nécessaires conformément à la Circulaire 04-2017.</p>
  `;

  // Notif broadcast pour RESPONSABLE_RISQUES et ADMIN
  let users: any[] = [];
  try {
    users = await prisma.user.findMany({
      where: { role: { in: ['RESPONSABLE_RISQUES', 'ADMIN'] } },
      select: { id: true, email: true },
    });
  } catch (err) {
    logger.error('notifyShortfall: impossible de récupérer les utilisateurs:', err);
  }

  await Promise.allSettled(
    users.map(async (u) => {
      await createNotification({
        userId: u.id,
        type: 'SHORTFALL',
        titre,
        message,
        entiteType: 'HYPOTHEQUE',
        entiteId: hypotheque.id,
      });
      await sendEmail(u.email, titre, buildEmailHtml(titre, htmlCorps));
      await sendWebPush(u.id, { titre, message, type: 'SHORTFALL' });
    }),
  );
}

/**
 * Crée une notification pour une expertise bientôt expirée.
 */
export async function notifyExpertiseExpiring(hypotheque: any): Promise<void> {
  const titre = `Expertise bientôt expirée — ${hypotheque.numeroPret}`;
  const message = `L'expertise du bien de ${hypotheque.nomClient} (${hypotheque.numeroPret}) approche de sa date limite. Réévaluation requise selon Circulaire 04-2017.`;

  let users: any[] = [];
  try {
    users = await prisma.user.findMany({
      where: { role: { in: ['GESTIONNAIRE_GARANTIES', 'RESPONSABLE_RISQUES', 'ADMIN'] } },
      select: { id: true, email: true },
    });
  } catch (err) {
    logger.error('notifyExpertiseExpiring: impossible de récupérer les utilisateurs:', err);
  }

  await Promise.allSettled(
    users.map(async (u) => {
      await createNotification({
        userId: u.id,
        type: 'EXPERTISE_BIENTOT_EXPIREE',
        titre,
        message,
        entiteType: 'HYPOTHEQUE',
        entiteId: hypotheque.id,
      });
    }),
  );
}

/**
 * Notifie les utilisateurs d'un rôle cible qu'un workflow attend leur validation.
 */
export async function notifyWorkflowPending(demande: any, targetRole: string): Promise<void> {
  const titre = `Validation requise — ${demande.titre}`;
  const message = `La demande « ${demande.titre} » (${demande.type}) attend votre validation.`;

  let users: any[] = [];
  try {
    users = await prisma.user.findMany({
      where: { role: targetRole as any },
      select: { id: true, email: true },
    });
  } catch (err) {
    logger.error('notifyWorkflowPending: impossible de récupérer les utilisateurs:', err);
  }

  await Promise.allSettled(
    users.map(async (u) => {
      await createNotification({
        userId: u.id,
        type: 'WORKFLOW_PENDING',
        titre,
        message,
        entiteType: 'DEMANDE_VALIDATION',
        entiteId: demande.id,
      });
      await sendWebPush(u.id, { titre, message, type: 'WORKFLOW_PENDING' });
    }),
  );
}

/**
 * Notifie le créateur d'une demande de la décision prise.
 */
export async function notifyWorkflowDecision(
  demande: any,
  approuve: boolean,
  commentaire?: string,
): Promise<void> {
  const decision = approuve ? 'approuvée' : 'rejetée';
  const titre = `Demande ${decision} — ${demande.titre}`;
  const message = `Votre demande « ${demande.titre} » a été ${decision}.${commentaire ? ` Commentaire : ${commentaire}` : ''}`;
  const htmlCorps = `
    <p>Votre demande a été <strong>${decision}</strong>.</p>
    <ul>
      <li><strong>Demande :</strong> ${demande.titre}</li>
      <li><strong>Type :</strong> ${demande.type}</li>
      ${commentaire ? `<li><strong>Commentaire :</strong> ${commentaire}</li>` : ''}
    </ul>
  `;

  if (!demande.createurId && !demande.createur?.id) return;
  const createurId: number = demande.createurId ?? demande.createur?.id;

  let createur: any;
  try {
    createur = await prisma.user.findUnique({
      where: { id: createurId },
      select: { id: true, email: true },
    });
  } catch (err) {
    logger.error('notifyWorkflowDecision: impossible de récupérer le créateur:', err);
    return;
  }

  if (!createur) return;

  await createNotification({
    userId: createur.id,
    type: approuve ? 'WORKFLOW_APPROVED' : 'WORKFLOW_REJECTED',
    titre,
    message,
    entiteType: 'DEMANDE_VALIDATION',
    entiteId: demande.id,
  });

  await sendEmail(createur.email, titre, buildEmailHtml(titre, htmlCorps));
  await sendWebPush(createur.id, { titre, message, type: approuve ? 'WORKFLOW_APPROVED' : 'WORKFLOW_REJECTED' });
}
