export function createSecretManager() {
  const secrets = {};

  if (process.env.GEMINI_API_KEY) {
    secrets['gemini-api-key'] = process.env.GEMINI_API_KEY;
  }

  return {
    async accessSecret(secretName) {
      if (secrets[secretName]) {
        return secrets[secretName];
      }

      try {
        const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
        if (!projectId) return null;

        const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
        const client = new SecretManagerServiceClient();

        const [version] = await client.accessSecretVersion({
          name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
        });

        const payload = version.payload.data.toString('utf8');
        secrets[secretName] = payload;
        return payload;
      } catch (err) {
        console.warn(`[SecretManager] Could not access secret "${secretName}":`, err.message);
        return null;
      }
    },

    setSecret(name, value) {
      secrets[name] = value;
    },
  };
}
