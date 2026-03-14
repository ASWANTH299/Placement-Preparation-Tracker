const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');

const SUPPORTED_LANGUAGES = [
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'C',
  'C++',
  'C#',
  'Go',
  'Rust',
  'Kotlin'
];

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
  TypeScript: {
    compile: [{ command: 'tsc', probeArgs: ['--version'] }],
    run: [{ command: 'node', probeArgs: ['--version'] }],
    directRun: [{ command: 'ts-node', probeArgs: ['--version'], runArgs: (filePath) => [filePath] }]
  },
  C: {
    compile: [
      { command: 'gcc', probeArgs: ['--version'] },
      { command: 'clang', probeArgs: ['--version'] }
    ]
  },
  'C++': {
    compile: [
      { command: 'g++', probeArgs: ['--version'] },
      { command: 'clang++', probeArgs: ['--version'] }
    ]
  },
  'C#': {
    compile: [
      { command: 'csc', probeArgs: ['-help'] },
      { command: 'mcs', probeArgs: ['--version'] }
    ],
    run: [{ command: 'mono', probeArgs: ['--version'] }]
  },
  Go: {
    run: [{ command: 'go', probeArgs: ['version'], runArgs: (filePath) => ['run', filePath] }]
  },
  Rust: {
    compile: [{ command: 'rustc', probeArgs: ['--version'] }]
  },
  Kotlin: {
    compile: [{ command: 'kotlinc', probeArgs: ['-version'] }],
    run: [{ command: 'java', probeArgs: ['-version'] }]
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

const missingToolchainResult = (phase, message) => ({
  success: false,
  phase,
  stdout: '',
  stderr: message,
  errors: [message],
  exitCode: 1,
  timedOut: false
});

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

const hasJavaMainMethod = (code) => /public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w+\s*\)/.test(String(code));
const hasCMain = (code) => /\bint\s+main\s*\(/.test(String(code));
const hasCppMain = (code) => /\bint\s+main\s*\(/.test(String(code));
const hasCSharpMain = (code) => /\bstatic\s+void\s+Main\s*\(/.test(String(code));

const getKotlinMainFileName = (code) => {
  const fileClass = String(code).match(/class\s+([A-Za-z_]\w*)/);
  if (fileClass) return `${fileClass[1]}.kt`;
  return 'Main.kt';
};

const getBinaryPath = (tempDir, baseName) => path.join(tempDir, process.platform === 'win32' ? `${baseName}.exe` : baseName);

const getAvailableToolchains = () => {
  return SUPPORTED_LANGUAGES.map((language) => {
    const profile = commandProfiles[language] || {};
    const compile = pickCommand(profile.compile || []);
    const run = pickCommand(profile.run || []);
    const directRun = pickCommand(profile.directRun || []);

    const compileRequired = Array.isArray(profile.compile) && profile.compile.length > 0;
    const runRequired = Array.isArray(profile.run) && profile.run.length > 0;
    const hasDirectRunFallback = Array.isArray(profile.directRun) && profile.directRun.length > 0;

    const available =
      (compileRequired ? Boolean(compile) : true) &&
      (runRequired ? Boolean(run) : true) ||
      (hasDirectRunFallback && Boolean(directRun));

    return {
      language,
      available,
      compileCommand: compile?.command || null,
      runCommand: run?.command || directRun?.command || null,
      notes: available ? 'Ready' : 'Compiler/runtime not found on server'
    };
  });
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
        return missingToolchainResult('compile', 'Java compiler/runtime not found on server (javac/java).');
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

      if (!hasJavaMainMethod(code)) {
        return {
          success: true,
          phase: 'compile',
          stdout: 'Compilation successful. Function-style Java solution detected (no main method). Runtime execution skipped.',
          stderr: '',
          errors: [],
          exitCode: 0,
          timedOut: false,
          functionMode: true
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
        return missingToolchainResult('run', 'Python runtime not found on server.');
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
        return missingToolchainResult('run', 'Node.js runtime not found on server.');
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

    if (language === 'TypeScript') {
      const directRunner = pickCommand(commandProfiles.TypeScript.directRun);
      if (directRunner) {
        const sourceFile = path.join(tempDir, 'main.ts');
        await fs.writeFile(sourceFile, code, 'utf8');

        const run = await runProcess({
          command: directRunner.command,
          args: directRunner.runArgs ? directRunner.runArgs(sourceFile) : [sourceFile],
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

      const compileCandidate = pickCommand(commandProfiles.TypeScript.compile);
      const runCandidate = pickCommand(commandProfiles.TypeScript.run);
      if (!compileCandidate || !runCandidate) {
        return missingToolchainResult('compile', 'TypeScript toolchain not found (tsc + node or ts-node).');
      }

      const sourceFile = path.join(tempDir, 'main.ts');
      await fs.writeFile(sourceFile, code, 'utf8');

      const compile = await runProcess({
        command: compileCandidate.command,
        args: ['--target', 'ES2020', '--module', 'commonjs', '--outDir', tempDir, sourceFile],
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

      const outputFile = path.join(tempDir, 'main.js');
      const run = await runProcess({
        command: runCandidate.command,
        args: [outputFile],
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

    if (language === 'C') {
      const compileCandidate = pickCommand(commandProfiles.C.compile);
      if (!compileCandidate) {
        return missingToolchainResult('compile', 'C compiler not found on server (gcc/clang).');
      }

      const sourceFile = path.join(tempDir, 'main.c');
      const outFile = getBinaryPath(tempDir, 'main_c');
      await fs.writeFile(sourceFile, code, 'utf8');

      const cHasMain = hasCMain(code);
      const compileArgs = cHasMain
        ? [sourceFile, '-O2', '-std=c17', '-o', outFile]
        : [sourceFile, '-O2', '-std=c17', '-c', '-o', path.join(tempDir, 'main_c.o')];

      const compile = await runProcess({
        command: compileCandidate.command,
        args: compileArgs,
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

      if (!cHasMain) {
        return {
          success: true,
          phase: 'compile',
          stdout: 'Compilation successful. Function-style C solution detected (no main function). Runtime execution skipped.',
          stderr: '',
          errors: [],
          exitCode: 0,
          timedOut: false,
          functionMode: true
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
    }

    if (language === 'C++') {
      const compileCandidate = pickCommand(commandProfiles['C++'].compile);
      if (!compileCandidate) {
        return missingToolchainResult('compile', 'C++ compiler not found on server (g++/clang++).');
      }

      const sourceFile = path.join(tempDir, 'main.cpp');
      const outFile = getBinaryPath(tempDir, 'main_cpp');
      await fs.writeFile(sourceFile, code, 'utf8');

      const cppHasMain = hasCppMain(code);
      const compileArgs = cppHasMain
        ? [sourceFile, '-O2', '-std=c++17', '-o', outFile]
        : [sourceFile, '-O2', '-std=c++17', '-c', '-o', path.join(tempDir, 'main_cpp.o')];

      const compile = await runProcess({
        command: compileCandidate.command,
        args: compileArgs,
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

      if (!cppHasMain) {
        return {
          success: true,
          phase: 'compile',
          stdout: 'Compilation successful. Function-style C++ solution detected (no main function). Runtime execution skipped.',
          stderr: '',
          errors: [],
          exitCode: 0,
          timedOut: false,
          functionMode: true
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
    }

    if (language === 'C#') {
      const compileCandidate = pickCommand(commandProfiles['C#'].compile);
      if (!compileCandidate) {
        return missingToolchainResult('compile', 'C# compiler not found on server (csc/mcs).');
      }

      const sourceFile = path.join(tempDir, 'Program.cs');
      const outFile = getBinaryPath(tempDir, 'Program');
      await fs.writeFile(sourceFile, code, 'utf8');

      const csharpHasMain = hasCSharpMain(code);
      const compileArgs = compileCandidate.command === 'mcs'
        ? (csharpHasMain ? [sourceFile, '-out:' + outFile] : [sourceFile, '-target:library', '-out:' + path.join(tempDir, 'Program.dll')])
        : (csharpHasMain ? ['/nologo', '/out:' + outFile, sourceFile] : ['/nologo', '/target:library', '/out:' + path.join(tempDir, 'Program.dll'), sourceFile]);

      const compile = await runProcess({
        command: compileCandidate.command,
        args: compileArgs,
        cwd: tempDir,
        timeoutMs
      });

      if (compile.exitCode !== 0 || compile.timedOut) {
        const errors = parseCompilerMessages(compile.stderr || compile.stdout);
        return {
          success: false,
          phase: 'compile',
          stdout: compile.stdout,
          stderr: compile.timedOut ? 'Compilation timed out.' : (compile.stderr || compile.stdout),
          errors: errors.length ? errors : [compile.timedOut ? 'Compilation timed out.' : 'Compilation failed.'],
          exitCode: compile.exitCode,
          timedOut: compile.timedOut
        };
      }

      if (!csharpHasMain) {
        return {
          success: true,
          phase: 'compile',
          stdout: 'Compilation successful. Function-style C# solution detected (no Main method). Runtime execution skipped.',
          stderr: '',
          errors: [],
          exitCode: 0,
          timedOut: false,
          functionMode: true
        };
      }

      let runCommand = outFile;
      let runArgs = [];
      if (compileCandidate.command === 'mcs' && process.platform !== 'win32') {
        const monoRunner = pickCommand(commandProfiles['C#'].run);
        if (!monoRunner) {
          return missingToolchainResult('run', 'Mono runtime not found for C# execution.');
        }
        runCommand = monoRunner.command;
        runArgs = [outFile];
      }

      const run = await runProcess({
        command: runCommand,
        args: runArgs,
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

    if (language === 'Go') {
      const runner = pickCommand(commandProfiles.Go.run);
      if (!runner) {
        return missingToolchainResult('run', 'Go runtime not found on server (go).');
      }

      const sourceFile = path.join(tempDir, 'main.go');
      await fs.writeFile(sourceFile, code, 'utf8');

      const run = await runProcess({
        command: runner.command,
        args: runner.runArgs ? runner.runArgs(sourceFile) : ['run', sourceFile],
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

    if (language === 'Rust') {
      const compileCandidate = pickCommand(commandProfiles.Rust.compile);
      if (!compileCandidate) {
        return missingToolchainResult('compile', 'Rust compiler not found on server (rustc).');
      }

      const sourceFile = path.join(tempDir, 'main.rs');
      const outFile = getBinaryPath(tempDir, 'main_rust');
      await fs.writeFile(sourceFile, code, 'utf8');

      const compile = await runProcess({
        command: compileCandidate.command,
        args: [sourceFile, '-O', '-o', outFile],
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
    }

    if (language === 'Kotlin') {
      const compileCandidate = pickCommand(commandProfiles.Kotlin.compile);
      const runCandidate = pickCommand(commandProfiles.Kotlin.run);
      if (!compileCandidate || !runCandidate) {
        return missingToolchainResult('compile', 'Kotlin toolchain not found on server (kotlinc + java).');
      }

      const sourceFile = path.join(tempDir, getKotlinMainFileName(code));
      const jarFile = path.join(tempDir, 'main-kotlin.jar');
      await fs.writeFile(sourceFile, code, 'utf8');

      const compile = await runProcess({
        command: compileCandidate.command,
        args: [sourceFile, '-include-runtime', '-d', jarFile],
        cwd: tempDir,
        timeoutMs
      });

      if (compile.exitCode !== 0 || compile.timedOut) {
        const errors = parseCompilerMessages(compile.stderr || compile.stdout);
        return {
          success: false,
          phase: 'compile',
          stdout: compile.stdout,
          stderr: compile.timedOut ? 'Compilation timed out.' : (compile.stderr || compile.stdout),
          errors: errors.length ? errors : [compile.timedOut ? 'Compilation timed out.' : 'Compilation failed.'],
          exitCode: compile.exitCode,
          timedOut: compile.timedOut
        };
      }

      const run = await runProcess({
        command: runCandidate.command,
        args: ['-jar', jarFile],
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

    return missingToolchainResult('validation', `Language not implemented: ${language}`);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};

module.exports = {
  executeCode,
  SUPPORTED_LANGUAGES,
  getAvailableToolchains
};
