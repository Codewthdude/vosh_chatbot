import { QdrantClient } from "@qdrant/js-client-rest";

// Hardcoded config
const qClient = new QdrantClient({
  url: "https://548b06ad-b46b-41e8-8dfa-7dee191c39ff.us-east4-0.gcp.cloud.qdrant.io:6333",   // e.g. "http://localhost:6333"
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.TKocTawVnaoQZEb4YsK8Vlf251_NH-QKXKZmFgzjgpk"     // if local no key needed
});

console.log("✅ Qdrant client ready");

export default qClient;
