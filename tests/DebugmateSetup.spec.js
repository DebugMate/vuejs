import DebugmateSetup from '../src/DebugmateSetup';
import { Context } from '../src/context';
import { parse } from '../src/stackTraceParser';

jest.mock('../src/context');
jest.mock('../src/stackTraceParser');

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

    it('should call fetch with correct parameters when publishing an error', async () => {
        const error = new Error('Test error');
        error.fileName = 'app.js';
        error.stack = 'Error: Test error\n    at testFunction (app.js:10:5)';
    
        const request = { url: '/test', method: 'GET' };
    
        parse.mockReturnValue({
            sources: [{ file: 'app.js', line: 10, column: 5 }],
            stack: 'Test stack',
        });
    
        await debugmate.publish(error, request);
    
        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.debugmate.com/api/capture',
            {
                method: 'POST',
                headers: {
                    'X-DEBUGMATE-TOKEN': 'test-token',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    exception: 'Unknown Error',
                    message: 'Unknown Message',
                    file: 'unknown',
                    type: 'web',
                    trace: [
                        {
                            file: 'unknown',
                            line: 0,
                        },
                    ],
                }),
            }
        );
    });
    

    it('should generate the correct payload', async () => {
        const error = new Error('Test error');
        const context = new Context();
    
        parse.mockReturnValue({
            sources: [{ file: 'app.js', line: 10, column: 5, function: 'testFunction', stack: 'Test stack' }],
            stack: 'Test stack'
        });
    
        const payload = await debugmate.createPayload(error, context);
    
        console.log('Received payload:', payload);
    
        expect(payload).toEqual({
            exception: 'Unknown Error',
            message: 'Unknown Message',
            file: 'unknown',
            type: 'web',
            trace: [
                {
                    file: 'unknown',
                    line: 0,
                },
            ],
            ...context.payload(),
        });
    });

    it('should handle errors in fetch', async () => {
        const error = new Error('Test error');

        mockFetch.mockImplementationOnce(() => Promise.resolve({ ok: false, status: 500 }));
        try {
            await debugmate.publish(error);
        } catch (err) {
            expect(err.message).toBe(`Erro na requisição: 500`);
        }
    });

    it('should use default checkAppContext if none provided', () => {
        const defaultDebugmate = new DebugmateSetup({ domain: 'https://api.debugmate.com', token: 'test-token' });
        const appContext = defaultDebugmate.checkAppContext();

        expect(appContext.getEnvironment()).toBe('test');
        expect(appContext.getUser()).toBeNull();
    });
});
