import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function pressKeys(...names: string[]) {
  const user = userEvent.setup()
  for (const name of names) await user.click(screen.getByRole('button', { name }))
}

describe('<App />', () => {
  it('performs a calculation through the API', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(respond({ operation: 'multiply', result: 3500 }))
    render(<App />)
    await pressKeys('2', '5', '0', 'Multiply', '1', '4', 'Equals')
    await waitFor(() => expect(screen.getByLabelText('Result')).toHaveTextContent('3,500'))
    expect(screen.getByTestId('expression')).toHaveTextContent('250 × 14 =')
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({ operation: 'multiply', a: 250, b: 14 })
  })

  it('shows an inline error for division by zero and recovers', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    render(<App />)
    await pressKeys('8', 'Divide', '0', 'Equals')
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot divide by zero')
    expect(fetchMock).not.toHaveBeenCalled()
    await pressKeys('All clear')
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('shows server errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respond({ error: { code: 'UNDEFINED_RESULT', message: 'result is undefined or not representable' } }, 422),
    )
    render(<App />)
    await pressKeys('9', 'Power', '9', 'Equals')
    expect(await screen.findByRole('alert')).toHaveTextContent('not representable')
  })

  it('toggles the theme', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /switch to light mode/i }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(await screen.findByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument()
  })

  it('marks the pending operator as pressed', async () => {
    render(<App />)
    await pressKeys('7', 'Add')
    expect(screen.getByRole('button', { name: 'Add' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('copies the result to the clipboard', async () => {
    render(<App />)
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    await pressKeys('4', '2')
    await user.click(screen.getByRole('button', { name: 'Copy result' }))
    expect(writeText).toHaveBeenCalledWith('42')
    expect(await screen.findByText('Copied')).toBeInTheDocument()
  })
})
