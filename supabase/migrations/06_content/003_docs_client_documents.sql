-- Extra internal_docs columns + client documents tables

ALTER TABLE internal_docs
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS last_edited_by uuid REFERENCES profiles(id);

ALTER TABLE internal_docs DROP CONSTRAINT IF EXISTS internal_docs_status_check;
ALTER TABLE internal_docs
  ADD CONSTRAINT internal_docs_status_check
  CHECK (status IN ('draft', 'published'));

CREATE TABLE IF NOT EXISTS client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  document_type text NOT NULL DEFAULT 'other',
  content_type text NOT NULL DEFAULT 'editor',
  body jsonb,
  file_url text,
  file_name text,
  file_size bigint,
  mime_type text,
  excerpt text,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_documents_type_check
    CHECK (document_type IN ('welcome','nda','thankyou','recommendation','proposal','contract','other')),
  CONSTRAINT client_documents_content_type_check
    CHECK (content_type IN ('editor','pdf'))
);

CREATE TRIGGER client_documents_updated_at
  BEFORE UPDATE ON client_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS client_document_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES client_documents(id) ON DELETE CASCADE,
  client_account_id uuid NOT NULL REFERENCES client_accounts(id) ON DELETE CASCADE,
  sent_by uuid NOT NULL REFERENCES profiles(id),
  sent_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz,
  UNIQUE (document_id, client_account_id)
);

ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_document_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_docs_select" ON client_documents;
CREATE POLICY "client_docs_select" ON client_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "client_docs_insert" ON client_documents;
CREATE POLICY "client_docs_insert" ON client_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "client_docs_update" ON client_documents;
CREATE POLICY "client_docs_update" ON client_documents
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "client_docs_delete" ON client_documents;
CREATE POLICY "client_docs_delete" ON client_documents
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "client_doc_sends_select" ON client_document_sends;
CREATE POLICY "client_doc_sends_select" ON client_document_sends
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "client_doc_sends_insert" ON client_document_sends;
CREATE POLICY "client_doc_sends_insert" ON client_document_sends
  FOR INSERT TO authenticated
  WITH CHECK (
    sent_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
