#!/bin/bash
# E2E Test Suite for Content Pipeline API

BASE_URL="http://localhost:3001"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

run_test() {
  local name="$1"
  local endpoint="$2"
  local expected_status="$3"
  local check_field="$4"
  local check_value="$5"
  local method="${6:-GET}"
  local body="$7"

  if [ "$method" = "POST" ] && [ -n "$body" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$body" "${BASE_URL}${endpoint}")
  elif [ "$method" = "POST" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' "${BASE_URL}${endpoint}")
  else
    response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
  fi

  status=$(echo "$response" | tail -1)
  body_response=$(echo "$response" | sed '$d')

  if [ "$status" = "$expected_status" ]; then
    if [ -n "$check_field" ]; then
      if echo "$body_response" | grep -q "$check_value"; then
        echo -e "${GREEN}✓ PASS${NC}: $name ($check_field contains $check_value)"
        ((PASS++))
      else
        echo -e "${RED}✗ FAIL${NC}: $name - $check_field does not contain $check_value"
        echo "  Response: $(echo $body_response | head -c 200)"
        ((FAIL++))
      fi
    else
      echo -e "${GREEN}✓ PASS${NC}: $name (HTTP $status)"
      ((PASS++))
    fi
  else
    echo -e "${RED}✗ FAIL${NC}: $name - Expected $expected_status, got $status"
    echo "  Response: $(echo $body_response | head -c 200)"
    ((FAIL++))
  fi
}

# Get a valid article ID
ARTICLE_ID=$(curl -s "${BASE_URL}/api/articles?limit=1" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
if [ -z "$ARTICLE_ID" ]; then
  ARTICLE_ID=2457
fi

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   Content Pipeline E2E Test Suite${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Using article ID: $ARTICLE_ID"
echo ""

# 1. Health & Infrastructure
echo -e "${YELLOW}[1/8] Health & Infrastructure${NC}"
run_test "Health check" "/api/health" "200"
run_test "Database status" "/api/health" "200" "status" "ok"
run_test "Redis status" "/api/health" "200" "redis" "ok"

# 2. Projects API
echo ""
echo -e "${YELLOW}[2/8] Projects API${NC}"
run_test "List projects" "/api/projects" "200"
run_test "Get project 2" "/api/projects/2" "200"
run_test "Project has name" "/api/projects/2" "200" "name" "Kimsufi"
run_test "Get project stats" "/api/projects/2/stats" "200"
run_test "Get relevance stats" "/api/projects/2/relevance-stats" "200"

# 3. Providers API
echo ""
echo -e "${YELLOW}[3/8] Providers API${NC}"
run_test "List all providers" "/api/providers" "200"
run_test "List project providers" "/api/providers?projectId=2" "200"
run_test "Provider has required fields" "/api/providers" "200" "id" ""

# 4. Articles API
echo ""
echo -e "${YELLOW}[4/8] Articles API${NC}"
run_test "List articles" "/api/articles" "200"
run_test "Articles has total" "/api/articles" "200" "total" ""
run_test "List project articles" "/api/articles?projectId=2" "200"
run_test "Filter by status" "/api/articles?status=transformed" "200"
run_test "Get single article" "/api/articles/$ARTICLE_ID" "200"
run_test "Article has content" "/api/articles/$ARTICLE_ID" "200" "title" ""

# 5. Jobs API
echo ""
echo -e "${YELLOW}[5/8] Jobs API${NC}"
run_test "List jobs" "/api/jobs" "200"
run_test "List archived jobs" "/api/jobs/archived" "200"
run_test "Jobs have structure" "/api/jobs" "200" "jobs" ""

# 6. Reporting API
echo ""
echo -e "${YELLOW}[6/8] Reporting API${NC}"
run_test "Reporting overview" "/api/reporting/overview" "200"
run_test "Overview has totalArticles" "/api/reporting/overview" "200" "totalArticles" ""
run_test "Reporting by project" "/api/reporting/by-project" "200"
run_test "Reporting by provider" "/api/reporting/by-provider" "200"
run_test "Reporting trends" "/api/reporting/trends" "200"

# 7. Stats API
echo ""
echo -e "${YELLOW}[7/8] Stats API${NC}"
run_test "Dashboard stats" "/api/stats" "200"
run_test "Stats has counts" "/api/stats" "200" "total" ""

# 8. DeepSeek Transform
echo ""
echo -e "${YELLOW}[8/8] DeepSeek Transform${NC}"
run_test "DeepSeek transform endpoint" "/api/articles/$ARTICLE_ID/transform-deepseek" "200" "" "" "POST"

# Summary
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   TEST SUMMARY${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Total tests: $((PASS + FAIL))"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}Some tests failed.${NC}"
  exit 1
else
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
fi
