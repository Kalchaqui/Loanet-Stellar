import { useState, useRef } from 'react';
import { useIdentityRegistry } from '../hooks/useIdentityRegistry';
import { useWalletContext } from '../contexts/WalletContext';
import { uploadToIPFS, uploadPersonalDataToIPFS } from '../utils/ipfsHelpers';
import LoanetSection from './LoanetSection';
import './IdentitySection.css';

export default function IdentitySection() {
  const { kit, connected, address } = useWalletContext();
  const { identity, hasIdentity, loading, createIdentity } = useIdentityRegistry(
    kit,
    connected,
    address
  );
  
  // Form state
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [pais, setPais] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  
  // Image state
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Check if contract is configured
  const IDENTITY_REGISTRY_CONTRACT = (import.meta as any).env?.VITE_IDENTITY_REGISTRY_CONTRACT || '';
  const contractConfigured = IDENTITY_REGISTRY_CONTRACT.trim() !== '';

  const handleFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateIdentity = async () => {
    // Validate all inputs
    if (!dni.trim()) {
      alert('Please enter your ID number');
      return;
    }
    if (!nombre.trim()) {
      alert('Please enter your first name');
      return;
    }
    if (!apellido.trim()) {
      alert('Please enter your last name');
      return;
    }
    if (!fechaNacimiento) {
      alert('Please enter your date of birth');
      return;
    }
    if (!direccion.trim()) {
      alert('Please enter your address');
      return;
    }
    if (!pais.trim()) {
      alert('Please enter your country');
      return;
    }
    if (!ciudad.trim()) {
      alert('Please enter your city');
      return;
    }
    if (!email.trim()) {
      alert('Please enter your email');
      return;
    }
    if (!telefono.trim()) {
      alert('Please enter your phone number');
      return;
    }
    if (!frontImage) {
      alert('Please select the ID image (front)');
      return;
    }
    if (!backImage) {
      alert('Please select the ID image (back)');
      return;
    }
    if (!address) {
      alert('Error: Wallet address not available');
      return;
    }

    if (!contractConfigured) {
      alert('Error: IdentityRegistry contract is not configured. Please configure VITE_IDENTITY_REGISTRY_CONTRACT in your .env file');
      return;
    }

    try {
      setUploading(true);
      
      // Step 1: Upload DNI images to IPFS
      console.log('Step 1: Uploading DNI images to IPFS...');
      const [dniFrontHash, dniBackHash] = await Promise.all([
        uploadToIPFS(frontImage),
        uploadToIPFS(backImage),
      ]);

      console.log('DNI images uploaded:', { dniFrontHash, dniBackHash });

      // Step 2: Upload all personal data (including image hashes) to IPFS as JSON
      console.log('Step 2: Uploading personal data to IPFS...');
      const personalData = {
        wallet: address,
        dni: dni.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        fechaNacimiento: fechaNacimiento,
        direccion: direccion.trim(),
        pais: pais.trim(),
        ciudad: ciudad.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        dniFrontImageHash: dniFrontHash,
        dniBackImageHash: dniBackHash,
      };

      const ipfsCid = await uploadPersonalDataToIPFS(personalData);
      console.log('Personal data uploaded. CID:', ipfsCid);

      // Step 3: Store only CID and DNI on-chain
      console.log('Step 3: Storing identity on-chain...');
      await createIdentity(dni.trim(), ipfsCid);
      
      // Clear form
      setDni('');
      setNombre('');
      setApellido('');
      setFechaNacimiento('');
      setDireccion('');
      setPais('');
      setCiudad('');
      setEmail('');
      setTelefono('');
      setFrontImage(null);
      setBackImage(null);
      setFrontPreview(null);
      setBackPreview(null);
      if (frontInputRef.current) frontInputRef.current.value = '';
      if (backInputRef.current) backInputRef.current.value = '';
      setShowRegisterForm(false);
      
      // Show success message
      alert('✅ Identity created successfully');
    } catch (error: any) {
      console.error('Error creating identity:', error);
      const errorMessage = error?.message || 'Error creating identity';
      
      // Provide more helpful error messages
      if (errorMessage.includes('rechazada') || errorMessage.includes('rejected')) {
        alert('⚠️ The transaction was rejected.\n\nPlease:\n1. Make sure to click "Confirm" or "Accept" in the Freighter modal\n2. Do NOT click "Cancel" or "Reject"\n3. Wait for the signature to complete\n\nTry again.');
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setUploading(false);
    }
  };

  if (!connected) {
    return null;
  }

  // If user is already registered, show their info
  if (hasIdentity && identity) {
    return (
      <LoanetSection title="🔐 Digital Identity">
        <div className="identity-info">
          <div className="info-row">
            <span className="label">IPFS CID:</span>
            <span className="value hash">{identity.ipfsCid}</span>
          </div>
          <div className="info-row">
            <span className="label">Verification Level:</span>
            <span className="value">{identity.verificationLevel}/3</span>
          </div>
          <div className="info-row">
            <span className="label">Status:</span>
            <span className={`value ${identity.verified ? 'verified' : 'unverified'}`}>
              {identity.verified ? '✅ Verified' : '⏳ Pending'}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Registration Date:</span>
            <span className="value">{new Date(identity.createdAt * 1000).toLocaleDateString()}</span>
          </div>
          <p className="help-text">
            💡 Your personal data is securely stored on IPFS.
            Access it using the provided CID.
          </p>
        </div>
      </LoanetSection>
    );
  }

  // If not registered, show register button or form
  return (
    <LoanetSection title="🔐 Digital Identity">
      {!showRegisterForm ? (
        <div className="identity-register-prompt">
          {!contractConfigured && (
            <div className="error-banner">
              ⚠️ The IdentityRegistry contract is not configured. Please configure VITE_IDENTITY_REGISTRY_CONTRACT in your .env file
            </div>
          )}
          <p className="description">
            To access the lending system, you need to register with your verified digital identity.
            All your sensitive data will be securely stored on IPFS, and only a hash will be saved on the blockchain.
          </p>
          <button
            onClick={() => setShowRegisterForm(true)}
            className="btn btn-primary"
            disabled={hasIdentity || loading}
            style={{
              opacity: hasIdentity ? 0.5 : 1,
              cursor: hasIdentity ? 'not-allowed' : 'pointer',
            }}
          >
            {hasIdentity ? 'Already Registered' : 'Register'}
          </button>
          {!contractConfigured && (
            <p className="help-text" style={{ marginTop: '12px', color: '#f59e0b' }}>
              ⚠️ Note: You need to configure VITE_IDENTITY_REGISTRY_CONTRACT in your .env file to create an identity
            </p>
          )}
        </div>
      ) : (
        <div className="identity-create">
          <div className="form-header">
            <h3>Digital Identity Registration</h3>
            <button
              onClick={() => setShowRegisterForm(false)}
              className="btn-link"
            >
              ← Cancel
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="wallet">Wallet (Address)</label>
            <input
              id="wallet"
              type="text"
              value={address || ''}
              disabled
              className="input input-disabled"
            />
            <small className="help-text">This is your connected wallet address</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dni">ID Number *</label>
              <input
                id="dni"
                type="text"
                placeholder="ID Number"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="input"
                maxLength={20}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fecha-nacimiento">Date of Birth *</label>
              <input
                id="fecha-nacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">First Name *</label>
              <input
                id="nombre"
                type="text"
                placeholder="First Name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Last Name *</label>
              <input
                id="apellido"
                type="text"
                placeholder="Last Name"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="direccion">Address *</label>
            <input
              id="direccion"
              type="text"
              placeholder="Full Address"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pais">Country *</label>
              <input
                id="pais"
                type="text"
                placeholder="Country"
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ciudad">City *</label>
              <input
                id="ciudad"
                type="text"
                placeholder="City"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Phone Number *</label>
              <input
                id="telefono"
                type="tel"
                placeholder="+1234567890"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dni-front">ID - Front *</label>
            <input
              id="dni-front"
              ref={frontInputRef}
              type="file"
              accept="image/*"
              onChange={handleFrontImageChange}
              className="file-input"
              required
            />
            {frontPreview && (
              <div className="image-preview">
                <img src={frontPreview} alt="ID Front" />
                <button
                  type="button"
                  onClick={() => {
                    setFrontImage(null);
                    setFrontPreview(null);
                    if (frontInputRef.current) frontInputRef.current.value = '';
                  }}
                  className="btn-remove"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="dni-back">ID - Back *</label>
            <input
              id="dni-back"
              ref={backInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackImageChange}
              className="file-input"
              required
            />
            {backPreview && (
              <div className="image-preview">
                <img src={backPreview} alt="ID Back" />
                <button
                  type="button"
                  onClick={() => {
                    setBackImage(null);
                    setBackPreview(null);
                    if (backInputRef.current) backInputRef.current.value = '';
                  }}
                  className="btn-remove"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="button-group">
            <button
              onClick={handleCreateIdentity}
              disabled={loading || uploading || !dni.trim() || !nombre.trim() || !apellido.trim() || !fechaNacimiento || !direccion.trim() || !pais.trim() || !ciudad.trim() || !email.trim() || !telefono.trim() || !frontImage || !backImage}
              className="btn btn-primary"
            >
              {uploading ? 'Uploading data to IPFS...' : loading ? 'Creating identity...' : 'Create Identity'}
            </button>
          </div>

          <p className="help-text">
            💡 All your sensitive data will be securely stored on IPFS.
            Only a hash (CID) will be saved on the blockchain to reduce storage costs.
            Your wallet will be uniquely linked to your ID number.
          </p>
        </div>
      )}
    </LoanetSection>
  );
}
