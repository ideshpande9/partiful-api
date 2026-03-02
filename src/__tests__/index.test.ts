import PartifulApi from '../index';

describe('test Partiful API Endpoints', () => {
  const AUTH_TOKEN =
    'eyJhbGciOiJSUzI1NiIsImtpZCI6IjRiMTFjYjdhYjVmY2JlNDFlOTQ4MDk0ZTlkZjRjNWI1ZWNhMDAwOWUiLCJ0eXAiOiJKV1QifQ.eyJwaWN0dXJlIjoiaHR0cHM6Ly9maXJlYmFzZXN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vdjAvYi9nZXRwYXJ0aWZ1bC5hcHBzcG90LmNvbS9vL3Byb2ZpbGVJbWFnZXMlMkYwYTk0Y2E5Mi1kN2Q0LTQwMmUtYWI_YWx0PW1lZGlhJnRva2VuPTdkZTgwNzUxLWZlMTAtNDgwMC1hNDllLWI3M2JjOTI4MGM5NCIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9nZXRwYXJ0aWZ1bCIsImF1ZCI6ImdldHBhcnRpZnVsIiwiYXV0aF90aW1lIjoxNzcxMDI3NTczLCJ1c2VyX2lkIjoiSW4xV1JFQUZEZ2Z3YTN5NzgzNlhnYUdJRU52MSIsInN1YiI6IkluMVdSRUFGRGdmd2EzeTc4MzZYZ2FHSUVOdjEiLCJpYXQiOjE3NzEwMjc1NzMsImV4cCI6MTc3MTAzMTE3MywicGhvbmVfbnVtYmVyIjoiKzE4NTgyNjE4NzA2IiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJwaG9uZSI6WyIrMTg1ODI2MTg3MDYiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJjdXN0b20ifX0.kPs1UXQ5GidiFIFljdxkc9w3xT7vXpVESHl4WSDdvXJXbJJjFYPlGQUDgRMRh8pVeh5hD979VIaXPB4UPmNYhMJZQECHuOhGco7rNZeB-zEJF332h0J5DtfBvERZn8v_nxIw0-HCRWWJpOoe0Ko1snAaOUbjrte8jUPJqRSlXffXt7i7k4sXOs6fEDxsYtuAMZnSME4VzJh6mNwEKkI5px8leW7tm5eem7AQQJtPDxVQnW7hmf9VabJimAazZhnbeOoiptxFbhOesIm2-Pon8IjSP0l0dasbhGptGQciZyWSXwMPQYtaiR0aJgQOFHnT-NaGsx6VFo_OVNbHvroGBQ';
  const USER_ID = 'z3Wi0Z7wPNYznzNdFXWD59w6atO2';
  const EVENT_ID = 'ONlRN7FzYo7wySk2VoUG';

  const partiful = new PartifulApi(AUTH_TOKEN);

  test('getMutuals', async () => {
    const result = await partiful.getMutuals();
    // TODO: need better test
    expect(result).toBeInstanceOf(Object);
  });

  test('getUsers', async () => {
    const result = await partiful.getUsers([USER_ID]);
    // TODO: need better test
    expect(result).toBeInstanceOf(Object);
  });

  test('getInvitableContacts', async () => {
    const result = await partiful.getInvitableContacts(EVENT_ID);
    expect(result).toBeInstanceOf(Object);
  });

  test('getGuestsCsv', async () => {
    const result = await partiful.getGuestsCsv(EVENT_ID);
    expect(result.length).toBeGreaterThan(0);
  });

  test('getEvent', async () => {
    const result = await partiful.getEvent(EVENT_ID);
    expect(JSON.stringify(result)).toBe(
      JSON.stringify({
        id: 'ONlRN7FzYo7wySk2VoUG',
        name: 'AI Builders Co-Working at Precursor Ventures',
        startDateTime: '2023-06-21T04:30:00.000Z',
        url: 'https://partiful.com/e/ONlRN7FzYo7wySk2VoUG',
      }),
    );
  });
});
