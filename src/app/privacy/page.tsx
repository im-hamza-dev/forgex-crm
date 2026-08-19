import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Forgex Systems',
  description: 'Privacy policy for Forgex CRM platform.',
}

export default function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F5F5',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 24px',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '680px',
          width: '100%',
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '48px 52px',
          border: '1px solid #E8E8E8',
        }}
      >
        {/* Wordmark */}
        <div style={{ marginBottom: '40px' }}>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1A1008',
              letterSpacing: '-0.3px',
            }}
          >
            Forgex
          </span>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#9c6644',
              letterSpacing: '-0.3px',
            }}
          >
            .systems
          </span>
        </div>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#1A1008',
            letterSpacing: '-0.4px',
            margin: '0 0 8px',
          }}
        >
          Privacy Policy
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#B0A090',
            marginBottom: '36px',
          }}
        >
          Last updated: August 2026
        </p>

        {[
          {
            title: 'Overview',
            content:
              'Forgex CRM is an internal platform used exclusively by invited team members and clients of Forgex Systems. Access is strictly restricted to authorized users only. This platform is not publicly accessible.',
          },
          {
            title: 'Data we collect',
            content:
              'When you sign in with Google, we collect your name and email address solely for authentication and account identification purposes. We do not collect any additional personal data beyond what is required for platform access.',
          },
          {
            title: 'How we use your data',
            content:
              'Your data is used only to authenticate you and provide access to the Forgex CRM platform. We do not sell, share, transfer, or use your data for advertising or any purpose other than platform authentication and access control.',
          },
          {
            title: 'Data security',
            content:
              'All data is stored securely using Supabase with row-level security policies enforced at the database level. Only authenticated and authorized users can access their own data. All connections are encrypted via HTTPS.',
          },
          {
            title: 'Data retention',
            content:
              'Your account data is retained for as long as your access to the platform remains active. Upon account deactivation, your data may be retained for audit purposes in accordance with our internal policies.',
          },
          {
            title: 'Your rights',
            content:
              'You have the right to request access to, correction of, or deletion of your personal data. To exercise these rights, contact us at the email address below.',
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: '28px' }}>
            <h2
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#1A1008',
                margin: '0 0 8px',
              }}
            >
              {section.title}
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: '#3D2E1E',
                lineHeight: 1.75,
                margin: 0,
              }}
            >
              {section.content}
            </p>
          </div>
        ))}

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: '#F0F0F0',
            margin: '32px 0',
          }}
        />

        {/* Contact */}
        <div>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#1A1008',
              margin: '0 0 8px',
            }}
          >
            Contact
          </h2>
          <p
            style={{
              fontSize: '15px',
              color: '#3D2E1E',
              lineHeight: 1.75,
              margin: 0,
            }}
          >
            For any privacy-related questions or data requests, contact us at{' '}
            <a
              href="mailto:hamza@forgex.systems"
              style={{
                color: '#9c6644',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              hamza@forgex.systems
            </a>
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '1px solid #F0F0F0',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              color: '#B0A090',
              margin: 0,
            }}
          >
            © 2026 Forgex Systems. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
