import { generateKeyPair, exportJWK } from 'jose';

(async () => {
  console.log('Generating RSA key pair...\n');

  // Generate RSA key pair
  const { publicKey, privateKey } = await generateKeyPair('RS256', {
    modulusLength: 2048
  });

  // Export as JWK
  const publicJWK = await exportJWK(publicKey);
  const privateJWK = await exportJWK(privateKey);

  console.log('✅ Keys generated successfully!\n');

  console.log('='.repeat(60));
  console.log('PUBLIC JWK (for verification):');
  console.log('='.repeat(60));
  console.log(JSON.stringify(publicJWK, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('PRIVATE JWK (for signing - KEEP SECRET):');
  console.log('='.repeat(60));
  console.log(JSON.stringify(privateJWK, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('FOR ENVIRONMENT VARIABLES (.dev.vars):');
  console.log('='.repeat(60));
  console.log(`JWT_PUBLIC_JWK='${JSON.stringify(publicJWK)}'`);
  console.log(`JWT_PRIVATE_JWK='${JSON.stringify(privateJWK)}'`);

  console.log('\n⚠️  IMPORTANT: Keep the private key secure!');
  console.log('📝 Copy these values to your .dev.vars and production secrets');
})();
