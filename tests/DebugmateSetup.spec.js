import DebugmateSetup from '../src/DebugmateSetup';  // Ajuste para apontar diretamente ao arquivo correto
import { Context } from '../src/context';  // Ajuste o caminho para apontar ao arquivo correto de contexto
import { parse } from '../src/stackTraceParser';  // Ajuste o caminho para apontar ao arquivo correto de stackTraceParser

jest.mock('../src/context');  // Mock da classe Context
jest.mock('../src/stackTraceParser');  // Mock do parse

describe('DebugmateSetup', () => {
    const options = {
        domain: 'https://api.debugmate.com',
        token: 'test-token',
        enabled: true,
        checkAppContext: jest.fn(() => ({
            getUser: jest.fn(() => ({ id: '123', name: 'John Doe' })),
            getEnvironment: jest.fn(() => 'development')
        })),
    };

    let debugmate;
    let mockFetch;

    beforeEach(() => {
        debugmate = new DebugmateSetup(options);
        mockFetch = jest.fn(() => Promise.resolve({ ok: true }));
        global.fetch = mockFetch;
        Context.mockClear();
        parse.mockClear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with default options', () => {
        expect(debugmate.domain).toBe('https://api.debugmate.com');
        expect(debugmate.token).toBe('test-token');
        expect(debugmate.enabled).toBe(true);
    });

    it('should not publish if disabled', () => {
        debugmate.enabled = false;
        const error = new Error('Test error');
        debugmate.publish(error);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not publish if no domain or token', () => {
        const error = new Error('Test error');

        debugmate.domain = null;
        debugmate.publish(error);
        expect(mockFetch).not.toHaveBeenCalled();

        debugmate.domain = 'https://api.debugmate.com';
        debugmate.token = null;
        debugmate.publish(error);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call fetch with correct parameters when publishing an error', () => {
        const error = new Error('Test error');
        const request = { url: '/test', method: 'GET' };
        const user = { id: '456', name: 'Jane Doe' };

        parse.mockReturnValue({
            sources: [{ file: 'app.js', line: 10, column: 5, function: 'testFunction', stack: 'Test stack' }]
        });

        debugmate.publish(error, request, user);

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.debugmate.com/api/capture',
            {
                method: 'POST',
                headers: {
                    'X-DEBUGMATE-TOKEN': 'test-token',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: expect.stringContaining('"message":"Test error"'),
            }
        );
    });

    it('should generate the correct payload', () => {
        const error = new Error('Test error');
        const context = new Context();

        parse.mockReturnValue({
            sources: [{ file: 'app.js', line: 10, column: 5, function: 'testFunction', stack: 'Test stack' }]
        });

        const payload = debugmate.payload(error, context);

        expect(payload).toEqual({
            exception: 'Error',
            message: 'Test error',
            file: 'app.js',
            type: 'web',
            trace: [
                {
                    file: 'app.js',
                    line: 10,
                    column: 5,
                    function: 'testFunction',
                    class: 'app.js',
                    preview: ['Test stack'],
                }
            ],
            ...context.payload(),
        });
    });

    it('should handle errors in fetch', async () => {
        const error = new Error('Test error');
        const fetchError = new Error('Erro na requisição: 500');

        mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: false, status: 500 }));

        await expect(debugmate.publish(error)).rejects.toThrow(fetchError.message);
    });

    it('should use default checkAppContext if none provided', () => {
        const defaultDebugmate = new DebugmateSetup({ domain: 'https://api.debugmate.com', token: 'test-token' });
        const appContext = defaultDebugmate.checkAppContext();

        expect(appContext.getEnvironment()).toBe('unknown');
        expect(appContext.getUser()).toBeNull();
    });
});
