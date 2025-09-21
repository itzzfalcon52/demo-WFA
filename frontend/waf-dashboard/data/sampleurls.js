// src/data/sample_urls.js

const SAMPLE_URLS = {
  whitelist: [
    {
      url: "http://example.com/",
      expected: { flagged: false, source: "whitelist" },
    },
    {
      url: "https://www.google.com/",
      expected: { flagged: false, source: "whitelist" },
    },
    {
      url: "https://docs.python.org/3/",
      expected: { flagged: false, source: "whitelist" },
    },
    {
      url: "https://github.com/",
      expected: { flagged: false, source: "whitelist" },
    },
    {
      url: "https://stackoverflow.com/questions/12345",
      expected: { flagged: false, source: "whitelist" },
    },
  ],
  blacklist: [
    {
      url: "https://malicious-site.com/evil-page",
      expected: { flagged: true, source: "blacklist" },
    },
    {
      url: "https://bad-example.org/attack-here",
      expected: { flagged: true, source: "blacklist" },
    },
    {
      url: "https://untrusted-domain.net/malware",
      expected: { flagged: true, source: "blacklist" },
    },
    {
      url: "https://hacker.com/phishing-page",
      expected: { flagged: true, source: "blacklist" },
    },
    {
      url: "http://phishing-test.com/login.php",
      expected: { flagged: true, source: "blacklist" },
    },
  ],
  regex_attacks: [
    {
      url: "http://example.com/page?id=1 OR 1=1",
      expected: { flagged: true, source: "regex" },
    },
    {
      url: "https://test.com/login?username=admin'--&password=test",
      expected: { flagged: true, source: "regex" },
    },
    {
      url: "<script>alert(1)</script>",
      expected: { flagged: true, source: "regex" },
    },
    { url: "../etc/passwd", expected: { flagged: true, source: "regex" } },
    {
      url: "<a href=\"javascript:alert('xss')\">Click me</a>",
      expected: { flagged: true, source: "regex" },
    },
  ],
  ml_tests: [
    {
      url: "https://unknown-malicious-domain.org/bad-page",
      expected: { flagged: true, source: "ML" },
    },
    {
      url: "https://new-phishing-site.com/steal-info",
      expected: { flagged: true, source: "ML" },
    },
    {
      url: "https://safe-site.org/home",
      expected: { flagged: false, source: "ML" },
    },
  ],
  edge_cases: [
    {
      url: "https://shop.example.com/product/abcd?color=red",
      expected: { flagged: false, source: "mixed" },
    },
    {
      url: "https://example.com/?q=<script>alert(1)</script>",
      expected: { flagged: true, source: "regex" },
    },
    {
      url: "https://malicious-site.com/evil-page",
      expected: { flagged: true, source: "ML" },
    },
  ],
};

export default SAMPLE_URLS;
