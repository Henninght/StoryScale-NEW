// Simple validation test for input analysis
const testCases = [
  {
    input: "I'm launching StoryScale",
    expectedType: "personal-announcement",
    expectedPersonal: "> 40",
    description: "Personal announcement detection"
  },
  {
    input: "AI tool for content",
    expectedType: "general-topic", 
    expectedPersonal: "< 30",
    description: "Low quality input detection"
  },
  {
    input: "I'm excited to launch StoryScale after seeing professionals struggle with LinkedIn content creation. It's an AI-powered studio that generates professional posts in under 15 seconds.",
    expectedType: "personal-announcement",
    expectedPersonal: "> 60", 
    description: "High quality personal announcement"
  },
  {
    input: "Content marketing strategies for businesses",
    expectedType: "general-topic",
    expectedPersonal: "< 20",
    description: "General topic detection"
  }
];

console.log("🧪 Input Analysis Validation Test");
console.log("=".repeat(50));

// Test results will be visible when imported in the browser
testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.description}`);
  console.log(`   Input: "${testCase.input}"`);
  console.log(`   Expected Type: ${testCase.expectedType}`);
  console.log(`   Expected Personal Level: ${testCase.expectedPersonal}`);
});

console.log("\n✅ Validation test cases defined");
console.log("Open http://localhost:3001/wizard to test manually");

export { testCases };