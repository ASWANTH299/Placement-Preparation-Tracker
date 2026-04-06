const { executeCode } = require('./src/utils/codeExecutor');

const samples = {
  TypeScript: 'console.log(5)',
  C: '#include <stdio.h>\nint main(){ printf("6\\n"); return 0; }',
  'C++': '#include <iostream>\nusing namespace std;\nint main(){ cout << 7 << "\\n"; return 0; }',
  Rust: 'fn main(){ println!("8"); }',
  Kotlin: 'fun main(){ println("9") }',
  'C#': 'using System; class Program { static void Main(string[] args){ Console.WriteLine("10"); } }',
  Go: 'package main\nimport "fmt"\nfunc main(){ fmt.Println(11) }'
};

(async () => {
  for (const language of Object.keys(samples)) {
    const result = await executeCode({ language, code: samples[language], timeoutMs: 25000 });
    console.log(language + ' => ' + JSON.stringify({ success: result.success, stdout: (result.stdout || '').trim(), stderr: (result.stderr || '').trim(), phase: result.phase }));
  }
})();
