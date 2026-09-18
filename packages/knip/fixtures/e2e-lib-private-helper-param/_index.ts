import { entry } from '@fixtures/e2e-lib-private-helper-param';

entry.readPrivateParam().toUpperCase();
entry.getRequiredResult().id.toUpperCase();
entry.readPassthrough().value.toUpperCase();
entry.composedApi().parser({ value: 'consumer' }).value.toUpperCase();
entry.getMemberResult().value.toUpperCase();
entry.getSelf().self;
entry.readConstrained().value.toUpperCase();
