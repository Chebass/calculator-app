import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { installFakeBackend, makeEntry } from './test/fakeBackend'

async function pressKeys(...names: string[]) {
  const user = userEvent.setup()
  for (const name of names) await user.click(screen.getByRole('button', { name }))
}

const result = () => screen.getByLabelText('Result')

// jsdom has no layout, so the sidebar (desktop) layout is the one under test here.
beforeEach(() => {
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes('min-width'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia
})

describe('calculator', () => {
  it('performs a calculation through the API and saves it to history', async () => {
    const { spy } = installFakeBackend()
    render(<App />)
    await pressKeys('2', '5', '0', 'Multiply', '1', '4', 'Equals')
    await waitFor(() => expect(result()).toHaveTextContent('3,500'))
    expect(screen.getByTestId('expression')).toHaveTextContent('250 × 14 =')

    const calls = spy.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${url}`)
    expect(calls).toContain('POST /api/calc/v1/calculate')
    expect(await screen.findByRole('button', { name: 'Reload 250 × 14 = 3500' })).toBeInTheDocument()
    expect(screen.getByText('1 saved')).toBeInTheDocument()
  })

  it('shows an inline error for division by zero without calling the server', async () => {
    const { spy } = installFakeBackend()
    render(<App />)
    await pressKeys('8', 'Divide', '0', 'Equals')
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot divide by zero')
    expect(spy.mock.calls.some(([url]) => String(url).includes('/calc/'))).toBe(false)
    await pressKeys('All clear')
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('shows server errors and does not save them', async () => {
    installFakeBackend({
      calculatorError: { status: 422, code: 'UNDEFINED_RESULT', message: 'result is undefined or not representable' },
    })
    render(<App />)
    await pressKeys('9', 'Power', '9', 'Equals')
    expect(await screen.findByRole('alert')).toHaveTextContent('not representable')
    expect(screen.getByText('0 saved')).toBeInTheDocument()
  })

  it('marks the pending operator as pressed', async () => {
    installFakeBackend()
    render(<App />)
    await pressKeys('7', 'Add')
    expect(screen.getByRole('button', { name: 'Add' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('copies the result to the clipboard', async () => {
    installFakeBackend()
    render(<App />)
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
    await pressKeys('4', '2')
    await user.click(screen.getByRole('button', { name: 'Copy result' }))
    expect(writeText).toHaveBeenCalledWith('42')
    expect(await screen.findByText('Copied')).toBeInTheDocument()
  })

  it('toggles the theme', async () => {
    installFakeBackend()
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /switch to light mode/i }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(await screen.findByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument()
  })
})

describe('history', () => {
  it('loads saved entries and restores one onto the display', async () => {
    installFakeBackend({ entries: [makeEntry({ id: 7, operation: 'multiply', a: 6, b: 7, result: 42 })] })
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Reload 6 × 7 = 42' }))
    expect(result()).toHaveTextContent('42')
    expect(screen.getByTestId('expression')).toHaveTextContent('6 × 7 =')
  })

  it('does not lose a calculation made while the history is still loading', async () => {
    const { spy } = installFakeBackend({ entries: [makeEntry({ id: 1 })] })
    const fake = spy.getMockImplementation()!
    let releaseList: () => void = () => {}
    const gate = new Promise<void>((resolve) => (releaseList = resolve))
    // Hold back only the initial GET /history response.
    spy.mockImplementation(async (input, init) => {
      const isList = String(input).includes('/history?') && (init?.method ?? 'GET') === 'GET'
      if (isList) await gate
      return fake(input, init)
    })
    render(<App />)
    await pressKeys('2', 'Add', '2', 'Equals')
    expect(await screen.findByRole('button', { name: 'Reload 2 + 2 = 4' })).toBeInTheDocument()
    releaseList()
    expect(await screen.findByRole('button', { name: 'Reload 1 + 2 = 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload 2 + 2 = 4' })).toBeInTheDocument()
  })

  it('shows an empty state', async () => {
    installFakeBackend()
    render(<App />)
    expect(await screen.findByText(/No calculations yet/)).toBeInTheDocument()
  })

  it('deletes an entry and clears all', async () => {
    installFakeBackend({ entries: [makeEntry({ id: 1 }), makeEntry({ id: 2, a: 5, b: 5, result: 10 })] })
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Delete 5 + 5' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Reload 5 + 5 = 10' })).not.toBeInTheDocument())
    expect(screen.getByText('1 saved')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(await screen.findByText(/No calculations yet/)).toBeInTheDocument()
  })

  it('edits an entry; the server recomputes the result', async () => {
    installFakeBackend({ entries: [makeEntry({ id: 1, a: 1, b: 2, result: 3 })] })
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Edit 1 + 2' }))

    const form = screen.getByRole('form', { name: 'Edit calculation' })
    await user.selectOptions(within(form).getByLabelText('Operation'), 'multiply')
    await user.clear(within(form).getByLabelText('First value'))
    await user.type(within(form).getByLabelText('First value'), '6')
    await user.clear(within(form).getByLabelText('Second value'))
    await user.type(within(form).getByLabelText('Second value'), '7')
    await user.click(within(form).getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('button', { name: 'Reload 6 × 7 = 42' })).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'Edit calculation' })).not.toBeInTheDocument()
  })

  it('validates the edit form and can be cancelled', async () => {
    installFakeBackend({ entries: [makeEntry({ id: 1 })] })
    render(<App />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Edit 1 + 2' }))
    const form = screen.getByRole('form', { name: 'Edit calculation' })

    await user.clear(within(form).getByLabelText('First value'))
    await user.click(within(form).getByRole('button', { name: 'Save' }))
    expect(within(form).getByRole('alert')).toHaveTextContent('First value must be a number')

    await user.type(within(form).getByLabelText('First value'), '0x10')
    await user.click(within(form).getByRole('button', { name: 'Save' }))
    expect(within(form).getByRole('alert')).toHaveTextContent('First value must be a number')
    await user.clear(within(form).getByLabelText('First value'))
    await user.type(within(form).getByLabelText('First value'), '4')
    await user.clear(within(form).getByLabelText('Second value'))
    await user.click(within(form).getByRole('button', { name: 'Save' }))
    expect(within(form).getByRole('alert')).toHaveTextContent('Second value must be a number')

    await user.selectOptions(within(form).getByLabelText('Operation'), 'sqrt')
    expect(within(form).getByLabelText('Second value')).toBeDisabled()

    await user.click(within(form).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('form', { name: 'Edit calculation' })).not.toBeInTheDocument()
  })

  it('keeps the calculator usable when the history service is down', async () => {
    installFakeBackend({ historyDown: true })
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('history service is unavailable')
    await pressKeys('1', 'Add', '1', 'Equals')
    await waitFor(() => expect(result()).toHaveTextContent('2'))
  })
})
