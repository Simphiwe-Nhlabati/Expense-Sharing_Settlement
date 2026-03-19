Run trufflesecurity/trufflehog@main
Run ##########################################
  ##########################################
  ## ADVANCED USAGE                       ##
  ## Scan by BASE & HEAD user inputs      ##
  ## If BASE == HEAD, exit with error     ##
  ##########################################
  # Check if jq is installed, if not, install it
  if ! command -v jq &> /dev/null
  then
    echo "jq could not be found, installing..."
    apt-get -y update && apt-get install -y jq
  fi
  
  git status >/dev/null  # make sure we are in a git repository
  if [ -n "$BASE" ] || [ -n "$HEAD" ]; then
    if [ -n "$BASE" ]; then
      base_commit=$(git rev-parse "$BASE" 2>/dev/null) || true
    else
      base_commit=""
    fi
    if [ -n "$HEAD" ]; then
      head_commit=$(git rev-parse "$HEAD" 2>/dev/null) || true
    else
      head_commit=""
    fi
    if [ "$base_commit" == "$head_commit" ] ; then
      echo "::error::BASE and HEAD commits are the same. TruffleHog won't scan anything. Please see documentation (https://github.com/trufflesecurity/trufflehog#octocat-trufflehog-github-action)."
      exit 1
    fi
  ##########################################
  ## Scan commits based on event type     ##
  ##########################################
  else
    if [ "push" == "push" ]; then
      COMMIT_LENGTH=$(printenv COMMIT_IDS | jq length)
      if [ $COMMIT_LENGTH == "0" ]; then
        echo "No commits to scan"
        exit 0
      fi
      HEAD=bcf490414c06a544c090048f93950ff59081ba1c
      if [ cbc37c25477a34d28616a19980f15ea9d0f6d4a2 == "0000000000000000000000000000000000000000" ]; then
        BASE=""
      else
        BASE=cbc37c25477a34d28616a19980f15ea9d0f6d4a2
      fi
    elif [ "push" == "workflow_dispatch" ] || [ "push" == "schedule" ]; then
      BASE=""
      HEAD=""
    elif [ "push" == "pull_request" ]; then
      BASE=
      HEAD=
    fi
  fi
  ##########################################
  ##          Run TruffleHog              ##
  ##########################################
  docker run --rm -v .:/tmp -w /tmp \
  ghcr.io/trufflesecurity/trufflehog:${VERSION} \
  git file:///tmp/ \
  --since-commit \
  ${BASE:-''} \
  --branch \
  ${HEAD:-''} \
  --fail \
  --no-update \
  --github-actions \
  ${ARGS:-''}
  shell: /usr/bin/bash --noprofile --norc -e -o pipefail {0}
  env:
    BASE: main
    HEAD: HEAD
    ARGS: --only-verified
    COMMIT_IDS: [
    "bcf490414c06a544c090048f93950ff59081ba1c"
  ]
    VERSION: latest
Error: BASE and HEAD commits are the same. TruffleHog won't scan anything. Please see documentation (https://github.com/trufflesecurity/trufflehog#octocat-trufflehog-github-action).
Error: Process completed with exit code 1.

















Run google/osv-scanner-action/osv-scanner-action@v2.2.2
/usr/bin/docker run --name ghcriogoogleosvscanneractionv222_a88dfc --label bee756 --workdir /github/workspace --rm -e "INPUT_SCAN-ARGS" -e "HOME" -e "GITHUB_JOB" -e "GITHUB_REF" -e "GITHUB_SHA" -e "GITHUB_REPOSITORY" -e "GITHUB_REPOSITORY_OWNER" -e "GITHUB_REPOSITORY_OWNER_ID" -e "GITHUB_RUN_ID" -e "GITHUB_RUN_NUMBER" -e "GITHUB_RETENTION_DAYS" -e "GITHUB_RUN_ATTEMPT" -e "GITHUB_ACTOR_ID" -e "GITHUB_ACTOR" -e "GITHUB_WORKFLOW" -e "GITHUB_HEAD_REF" -e "GITHUB_BASE_REF" -e "GITHUB_EVENT_NAME" -e "GITHUB_SERVER_URL" -e "GITHUB_API_URL" -e "GITHUB_GRAPHQL_URL" -e "GITHUB_REF_NAME" -e "GITHUB_REF_PROTECTED" -e "GITHUB_REF_TYPE" -e "GITHUB_WORKFLOW_REF" -e "GITHUB_WORKFLOW_SHA" -e "GITHUB_REPOSITORY_ID" -e "GITHUB_TRIGGERING_ACTOR" -e "GITHUB_WORKSPACE" -e "GITHUB_ACTION" -e "GITHUB_EVENT_PATH" -e "GITHUB_ACTION_REPOSITORY" -e "GITHUB_ACTION_REF" -e "GITHUB_PATH" -e "GITHUB_ENV" -e "GITHUB_STEP_SUMMARY" -e "GITHUB_STATE" -e "GITHUB_OUTPUT" -e "RUNNER_OS" -e "RUNNER_ARCH" -e "RUNNER_NAME" -e "RUNNER_ENVIRONMENT" -e "RUNNER_TOOL_CACHE" -e "RUNNER_TEMP" -e "RUNNER_WORKSPACE" -e "ACTIONS_RUNTIME_URL" -e "ACTIONS_RUNTIME_TOKEN" -e "ACTIONS_CACHE_URL" -e "ACTIONS_RESULTS_URL" -e "ACTIONS_ORCHESTRATION_ID" -e GITHUB_ACTIONS=true -e CI=true -v "/var/run/docker.sock":"/var/run/docker.sock" -v "/home/runner/work/_temp":"/github/runner_temp" -v "/home/runner/work/_temp/_github_home":"/github/home" -v "/home/runner/work/_temp/_github_workflow":"/github/workflow" -v "/home/runner/work/_temp/_runner_file_commands":"/github/file_commands" -v "/home/runner/work/Expense-Sharing_Settlement/Expense-Sharing_Settlement":"/github/workspace" ghcr.io/google/osv-scanner-action:v2.2.2  "--lockfile=bun.lock
--format=table"
Scanned /github/workspace/bun.lock file and found 991 packages
Total 12 packages affected by 31 known vulnerabilities (0 Critical, 17 High, 12 Medium, 2 Low, 0 Unknown) from 1 ecosystem.
31 vulnerabilities can be fixed.


+-------------------------------------+------+-----------+--------------------+---------+---------------+----------+
| OSV URL                             | CVSS | ECOSYSTEM | PACKAGE            | VERSION | FIXED VERSION | SOURCE   |
+-------------------------------------+------+-----------+--------------------+---------+---------------+----------+
| https://osv.dev/GHSA-wc8c-qw6v-h7f6 | 7.5  | npm       | @hono/node-server  | 1.19.9  | 1.19.10       | bun.lock |
| https://osv.dev/GHSA-2g4f-4pwh-qvx6 | 5.5  | npm       | ajv                | 6.12.6  | 6.14.0        | bun.lock |
| https://osv.dev/GHSA-67mh-4wv8-2f99 | 5.3  | npm       | esbuild            | 0.18.20 | 0.25.0        | bun.lock |
| https://osv.dev/GHSA-46wh-pxpv-q5gq | 7.5  | npm       | express-rate-limit | 8.2.1   | 8.2.2         | bun.lock |
| https://osv.dev/GHSA-25h7-pfq9-p65f | 7.5  | npm       | flatted            | 3.3.3   | 3.4.0         | bun.lock |
| https://osv.dev/GHSA-5pq2-9x2x-5p6w | 5.4  | npm       | hono               | 4.11.9  | 4.12.4        | bun.lock |
| https://osv.dev/GHSA-gq3j-xvxp-8hrf | 3.7  | npm       | hono               | 4.11.9  | 4.11.10       | bun.lock |
| https://osv.dev/GHSA-p6xx-57qc-3wxr | 6.5  | npm       | hono               | 4.11.9  | 4.12.4        | bun.lock |
| https://osv.dev/GHSA-q5qw-h33p-qvwr | 7.5  | npm       | hono               | 4.11.9  | 4.12.4        | bun.lock |
| https://osv.dev/GHSA-v8w9-8mx6-g223 | 4.8  | npm       | hono               | 4.11.9  | 4.12.7        | bun.lock |
| https://osv.dev/GHSA-23c5-xmqv-rm74 | 7.5  | npm       | minimatch          | 10.2.0  | 10.2.3        | bun.lock |
| https://osv.dev/GHSA-3ppc-4f35-3m26 | 8.7  | npm       | minimatch          | 10.2.0  | 10.2.1        | bun.lock |
| https://osv.dev/GHSA-7r86-cg39-jmmj | 7.5  | npm       | minimatch          | 10.2.0  | 10.2.3        | bun.lock |
| https://osv.dev/GHSA-23c5-xmqv-rm74 | 7.5  | npm       | minimatch          | 3.1.2   | 3.1.4         | bun.lock |
| https://osv.dev/GHSA-3ppc-4f35-3m26 | 8.7  | npm       | minimatch          | 3.1.2   | 3.1.3         | bun.lock |
| https://osv.dev/GHSA-7r86-cg39-jmmj | 7.5  | npm       | minimatch          | 3.1.2   | 3.1.3         | bun.lock |
| https://osv.dev/GHSA-23c5-xmqv-rm74 | 7.5  | npm       | minimatch          | 9.0.5   | 9.0.7         | bun.lock |
| https://osv.dev/GHSA-3ppc-4f35-3m26 | 8.7  | npm       | minimatch          | 9.0.5   | 9.0.6         | bun.lock |
| https://osv.dev/GHSA-7r86-cg39-jmmj | 7.5  | npm       | minimatch          | 9.0.5   | 9.0.7         | bun.lock |
| https://osv.dev/GHSA-3x4c-7xq6-9pq8 | 6.9  | npm       | next               | 16.1.6  | 16.1.7        | bun.lock |
| https://osv.dev/GHSA-ggv3-7p47-pfv8 | 6.3  | npm       | next               | 16.1.6  | 16.1.7        | bun.lock |
| https://osv.dev/GHSA-h27x-g6w4-24gq | 6.9  | npm       | next               | 16.1.6  | 16.1.7        | bun.lock |
| https://osv.dev/GHSA-jcc7-9wpm-mj36 | 2.3  | npm       | next               | 16.1.6  | 16.1.7        | bun.lock |
| https://osv.dev/GHSA-mq59-m269-xvcx | 5.3  | npm       | next               | 16.1.6  | 16.1.7        | bun.lock |
| https://osv.dev/GHSA-mw96-cpmx-2vgc | 8.8  | npm       | rollup             | 4.57.1  | 4.59.0        | bun.lock |
| https://osv.dev/GHSA-2mjp-6q6p-2qxm | 6.5  | npm       | undici             | 7.22.0  | 7.24.0        | bun.lock |
| https://osv.dev/GHSA-4992-7rv2-5pvq | 4.6  | npm       | undici             | 7.22.0  | 7.24.0        | bun.lock |
| https://osv.dev/GHSA-f269-vfmq-vjvj | 7.5  | npm       | undici             | 7.22.0  | 7.24.0        | bun.lock |
| https://osv.dev/GHSA-phc3-fgpg-7m6h | 5.9  | npm       | undici             | 7.22.0  | 7.24.0        | bun.lock |
| https://osv.dev/GHSA-v9p9-hfj2-hcw8 | 7.5  | npm       | undici             | 7.22.0  | 7.24.0        | bun.lock |
| https://osv.dev/GHSA-vrm6-8vpv-qv8q | 7.5  | npm       | undici             | 7.22.0  | 7.24.0        | bun.lock |
+-------------------------------------+------+-----------+--------------------+---------+---------------+----------+
Exit code: 1