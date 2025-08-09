describe('Sample Test', () => {
  it('should pass a simple test', () => {
    expect(2 + 2).toBe(4)
  })

  it('should test environment variables', () => {
    expect(process.env.OPENAI_API_KEY).toBeDefined()
    expect(process.env.ANTHROPIC_API_KEY).toBeDefined()
  })
})