/* tracing.js */

const opentelemetry = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const { ZipkinExporter } = require("@opentelemetry/exporter-zipkin");
const {
  ConsoleSpanExporter,
  BatchSpanProcessor,
  AlwaysOnSampler,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} = require("@opentelemetry/sdk-trace-base");
const { Resource } = require("@opentelemetry/resources");
const {
  SemanticResourceAttributes,
} = require("@opentelemetry/semantic-conventions");

console.log("opentelemetry version: 0.2")
//const { AlwaysOnSampler,ParentBasedSampler,TraceIdRatioBasedSampler } = require("@opentelemetry/core");
//const { OTLPTraceExporter,} = require("@opentelemetry/exporter-trace-otlp-http");
//const { PinoInstrumentation } = require('@opentelemetry/instrumentation-pino');

const SERVICE_NAME = process.env.SERVICE_NAME || "STUDIUM";
const SERVICE_VERSION = "0.1.0";
const SAMPLER_RATIO = parseInt(process.env.SAMPLER_RATIO) || 1;
const NODE_ENV = process.env.NODE_ENV || "production";
const ZIPKIN_ENDPOINT = process.env.ZIPKIN_ENDPOINT;

console.log(SERVICE_NAME, SAMPLER_RATIO, NODE_ENV, ZIPKIN_ENDPOINT);

const zipkinOptions = {
  headers: {},
  url: ZIPKIN_ENDPOINT
}

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: SERVICE_VERSION,
  })
);

const sdk = new opentelemetry.NodeSDK({
  resource: resource,
  spanProcessor: new BatchSpanProcessor(
    NODE_ENV === "production"
      ? new ZipkinExporter(zipkinOptions)
      : new ConsoleSpanExporter()
  ),
  /*spanProcessor:new BatchSpanProcessor(
    new OTLPTraceExporter({
      // optional - url default value is http://localhost:4318/v1/traces
      url: "http://localhost:4318/v1/traces",
      // optional - collection of custom headers to be sent with each request, empty by default
      headers: {},
    })),*/
  instrumentations: [getNodeAutoInstrumentations()],
  sampler: NODE_ENV === "production"
      ? new ParentBasedSampler({
          root: new TraceIdRatioBasedSampler(SAMPLER_RATIO),
        })
      : new AlwaysOnSampler(),
});

sdk.start();
