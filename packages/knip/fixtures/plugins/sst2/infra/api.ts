export const api = new sst.aws.ApiGatewayV2('Api');

api.route('GET /notes', 'functions/list.main');
api.route('POST /notes', { handler: 'functions/create.main' });
