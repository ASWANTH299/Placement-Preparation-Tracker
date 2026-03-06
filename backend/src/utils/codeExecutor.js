const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');

const SUPPORTED_LANGUAGES = ['Java', 'Python', 'JavaScript', 'C++'];

const commandProfiles = {
  Java: {
    compile: [{ command: 'javac', probeArgs: ['-version'] }],
    run: [{ command: 'java', probeArgs: ['-version'] }]
  },
  Python: {
    run: [
      { command: 'python', probeArgs: ['--version'], runArgs: (filePath) => [filePath] },
      { command: 'python3', probeArgs: ['--version'], runArgs: (filePath) => [filePath] },
      { command: 'py', probeArgs: ['-3', '--version'], runArgs: (filePath) => ['-3', filePath] }
    ]
  },
  JavaScript: {
    run: [{ command: 'node', probeArgs: ['--version'], runArgs: (filePath) => [filePath] }]
  },
  'C++': {
    compile: [
      { command: 'g++', probeArgs: ['--version'] },
      { command: 'clang++', probeArgs: ['--version'] }
    ]
  }
};

const hasCommand = (candidate) => {
  const probe = spawnSync(candidate.command, candidate.probeArgs || ['--version'], {
    stdio: 'ignore',
    shell: false
  });

  return !probe.error;
};

const pickCommand = (candidates = []) => {
  for (const candidate of candidates) {
    if (hasCommand(candidate)) return candidate;
  }
  return null;
};

const runProcess = ({ command, args, cwd, stdin = '', timeoutMs = 6000 }) => {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, shell: false });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${error.message}`.trim(),
        timedOut
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: typeof code === 'number' ? code : 1,
        stdout,
        stderr,
        timedOut
      });
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
};

const parseCompilerMessages = (text) => {
  const lines = String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const messages = [];

  for (const line of lines) {
    const generic = line.match(/:(\d+):(?:(\d+):)?\s*(error|warning|note)?\s*(.*)$/i);
    if (generic) {
      const lineNumber = Number(generic[1]);
      const detail = (generic[4] || line).trim();
      messages.push(`Line ${lineNumber}: ${detail || line}`);
      continue;
    }

    const python = line.match(/line\s+(\d+)/i);
    if (python) {
      messages.push(`Line ${Number(python[1])}: ${line}`);
      continue;
    }

    if (/error|exception|syntax/i.test(line)) {
      messages.push(line);
    }
  }

  return Array.from(new Set(messages));
};

const getJavaClassName = (code) => {
  const publicClass = String(code).match(/public\s+class\s+([A-Za-z_]\w*)/);
  if (publicClass) return publicClass[1];

  const anyClass = String(code).match(/class\s+([A-Za-z_]\w*)/);
  if (anyClass) return anyClass[1];

  return 'Main';
};

const executeCode = async ({ language, code, input = '', timeoutMs = 6000 }) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return {
      success: false,
      phase: 'validation',
      stdout: '',
      stderr: `Unsupported language: ${language}`,
      errors: [`Unsupported language: ${language}`],
      exitCode: 1,
      timedOut: false
    };
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ppt-compile-'));

  try {
    if (language === 'Java') {
      const compileCandidate = pickCommand(commandProfiles.Java.compile);
      const runCandidate = pickCommand(commandProfiles.Java.run);
      if (!compileCandidate || !runCandidate) {
        return {
          success: false,
          phase: 'compile',
          stdout: '',
          stderr: 'Java compiler/runtime not found on server (javac/java).',
          errors: ['Java compiler/runtime not found on server (javac/java).'],
          exitCode: 1,
          timedOut: false
        };
      }

      const className = getJavaClassName(code);
      const sourceFile = path.join(tempDir, `${className}.java`);
      await fs.writeFile(sourceFile, code, 'utf8');

      const compile = await runProcess({
        command: compileCandidate.command,
        args: [sourceFile],
        cwd: tempDir,
        timeoutMs
      });

      if (compile.exitCode !== 0 || compile.timedOut) {
        const errors = parseCompilerMessages(compile.stderr);
        return {
          success: false,
          phase: 'compile',
          stdout: compile.stdout,
          stderr: compile.timedOut ? 'Compilation timed out.' : compile.stderr,
          errors: errors.length ? errors : [compile.timedOut ? 'Compilation timed out.' : 'Compilation failed.'],
          exitCode: compile.exitCode,
          timedOut: compile.timedOut
        };
      }

      const run = await runProcess({
        command: runCandidate.command,
        args: ['-cp', tempDir, className],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      const runtimeErrors = parseCompilerMessages(run.stderr);
      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: runtimeErrors,
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    if (language === 'Python') {
      const runner = pickCommand(commandProfiles.Python.run);
      if (!runner) {
        return {
          success: false,
          phase: 'run',
          stdout: '',
          stderr: 'Python runtime not found on server.',
          errors: ['Python runtime not found on server.'],
          exitCode: 1,
          timedOut: false
        };
      }

      const sourceFile = path.join(tempDir, 'main.py');
      await fs.writeFile(sourceFile, code, 'utf8');

      const run = await runProcess({
        command: runner.command,
        args: runner.runArgs ? runner.runArgs(sourceFile) : [sourceFile],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: parseCompilerMessages(run.stderr),
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    if (language === 'JavaScript') {
      const runner = pickCommand(commandProfiles.JavaScript.run);
      if (!runner) {
        return {
          success: false,
          phase: 'run',
          stdout: '',
          stderr: 'Node.js runtime not found on server.',
          errors: ['Node.js runtime not found on server.'],
          exitCode: 1,
          timedOut: false
        };
      }

      const sourceFile = path.join(tempDir, 'main.js');
      await fs.writeFile(sourceFile, code, 'utf8');

      const run = await runProcess({
        command: runner.command,
        args: runner.runArgs ? runner.runArgs(sourceFile) : [sourceFile],
        cwd: tempDir,
        stdin: input,
        timeoutMs
      });

      return {
        success: run.exitCode === 0 && !run.timedOut,
        phase: 'run',
        stdout: run.stdout,
        stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
        errors: parseCompilerMessages(run.stderr),
        exitCode: run.exitCode,
        timedOut: run.timedOut
      };
    }

    const compileCandidate = pickCommand(commandProfiles['C++'].compile);
    if (!compileCandidate) {
      return {
        success: false,
        phase: 'compile',
        stdout: '',
        stderr: 'C++ compiler not found on server (g++/clang++).',
        errors: ['C++ compiler not found on server (g++/clang++).'],
        exitCode: 1,
        timedOut: false
      };
    }

    const sourceFile = path.join(tempDir, 'main.cpp');
    const outFile = path.join(tempDir, process.platform === 'win32' ? 'main.exe' : 'main.out');
    await fs.writeFile(sourceFile, code, 'utf8');

    const compile = await runProcess({
      command: compileCandidate.command,
      args: [sourceFile, '-o', outFile],
      cwd: tempDir,
      timeoutMs
    });

    if (compile.exitCode !== 0 || compile.timedOut) {
      const errors = parseCompilerMessages(compile.stderr);
      return {
        success: false,
        phase: 'compile',
        stdout: compile.stdout,
        stderr: compile.timedOut ? 'Compilation timed out.' : compile.stderr,
        errors: errors.length ? errors : [compile.timedOut ? 'Compilation timed out.' : 'Compilation failed.'],
        exitCode: compile.exitCode,
        timedOut: compile.timedOut
      };
    }

    const run = await runProcess({
      command: outFile,
      args: [],
      cwd: tempDir,
      stdin: input,
      timeoutMs
    });

    return {
      success: run.exitCode === 0 && !run.timedOut,
      phase: 'run',
      stdout: run.stdout,
      stderr: run.timedOut ? 'Execution timed out.' : run.stderr,
      errors: parseCompilerMessages(run.stderr),
      exitCode: run.exitCode,
      timedOut: run.timedOut
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};

module.exports = {
  executeCode,
  SUPPORTED_LANGUAGES
};
