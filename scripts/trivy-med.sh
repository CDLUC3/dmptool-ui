# Run a non-blocking Trivy check for MEDIUM and LOW vulnerabilities
echo "Running Trivy medium/low vulnerability scan..."

trivy fs --exit-code 0 --severity MEDIUM,LOW --ignorefile .trivyignore.yaml . || {
  echo "Trivy found medium/low vulnerabilities (non-blocking)."
}
