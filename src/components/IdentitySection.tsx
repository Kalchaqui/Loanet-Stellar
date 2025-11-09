import React, { useState, useRef } from 'react';
import { useIdentityRegistry } from '../hooks/useIdentityRegistry';
import { useWalletContext } from '../contexts/WalletContext';
import { uploadToIPFS, uploadPersonalDataToIPFS } from '../utils/ipfsHelpers';
import LoanetSection from './LoanetSection';
import './IdentitySection.css';

export default function IdentitySection() {
  const { kit, connected, address } = useWalletContext();
  const { identity, hasIdentity, loading, createIdentity, refresh } = useIdentityRegistry(
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
  const IDENTITY_REGISTRY_CONTRACT = import.meta.env.VITE_IDENTITY_REGISTRY_CONTRACT || '';
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
      alert('Por favor ingresa tu DNI');
      return;
    }
    if (!nombre.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }
    if (!apellido.trim()) {
      alert('Por favor ingresa tu apellido');
      return;
    }
    if (!fechaNacimiento) {
      alert('Por favor ingresa tu fecha de nacimiento');
      return;
    }
    if (!direccion.trim()) {
      alert('Por favor ingresa tu dirección');
      return;
    }
    if (!pais.trim()) {
      alert('Por favor ingresa tu país');
      return;
    }
    if (!ciudad.trim()) {
      alert('Por favor ingresa tu ciudad');
      return;
    }
    if (!email.trim()) {
      alert('Por favor ingresa tu email');
      return;
    }
    if (!telefono.trim()) {
      alert('Por favor ingresa tu teléfono');
      return;
    }
    if (!frontImage) {
      alert('Por favor selecciona la imagen del DNI (frente)');
      return;
    }
    if (!backImage) {
      alert('Por favor selecciona la imagen del DNI (dorso)');
      return;
    }
    if (!address) {
      alert('Error: Dirección de wallet no disponible');
      return;
    }

    if (!contractConfigured) {
      alert('Error: El contrato IdentityRegistry no está configurado. Por favor configura VITE_IDENTITY_REGISTRY_CONTRACT en tu archivo .env');
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
      alert('✅ Identidad creada exitosamente');
    } catch (error: any) {
      console.error('Error creating identity:', error);
      const errorMessage = error?.message || 'Error al crear la identidad';
      
      // Provide more helpful error messages
      if (errorMessage.includes('rechazada') || errorMessage.includes('rejected')) {
        alert('⚠️ La transacción fue rechazada.\n\nPor favor:\n1. Asegúrate de hacer clic en "Confirm" o "Aceptar" en el modal de Freighter\n2. NO hagas clic en "Cancel" o "Rechazar"\n3. Espera a que se complete la firma\n\nIntenta de nuevo.');
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
      <LoanetSection title="🔐 Identidad Digital">
        <div className="identity-info">
          <div className="info-row">
            <span className="label">IPFS CID:</span>
            <span className="value hash">{identity.ipfsCid}</span>
          </div>
          <div className="info-row">
            <span className="label">Nivel de Verificación:</span>
            <span className="value">{identity.verificationLevel}/3</span>
          </div>
          <div className="info-row">
            <span className="label">Estado:</span>
            <span className={`value ${identity.verified ? 'verified' : 'unverified'}`}>
              {identity.verified ? '✅ Verificado' : '⏳ Pendiente'}
            </span>
          </div>
          <div className="info-row">
            <span className="label">Fecha de Registro:</span>
            <span className="value">{new Date(identity.createdAt * 1000).toLocaleDateString()}</span>
          </div>
          <p className="help-text">
            💡 Tus datos personales están almacenados de forma segura en IPFS.
            Accede a ellos usando el CID proporcionado.
          </p>
        </div>
      </LoanetSection>
    );
  }

  // If not registered, show register button or form
  return (
    <LoanetSection title="🔐 Identidad Digital">
      {!showRegisterForm ? (
        <div className="identity-register-prompt">
          {!contractConfigured && (
            <div className="error-banner">
              ⚠️ El contrato IdentityRegistry no está configurado. Por favor configura VITE_IDENTITY_REGISTRY_CONTRACT en tu archivo .env
            </div>
          )}
          <p className="description">
            Para acceder al sistema de préstamos, necesitas registrarte con tu identidad digital verificada.
            Todos tus datos sensibles se almacenarán de forma segura en IPFS, y solo se guardará un hash en la blockchain.
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
            {hasIdentity ? 'Ya Registrado' : 'Registrarse'}
          </button>
          {!contractConfigured && (
            <p className="help-text" style={{ marginTop: '12px', color: '#f59e0b' }}>
              ⚠️ Nota: Necesitas configurar VITE_IDENTITY_REGISTRY_CONTRACT en tu archivo .env para poder crear la identidad
            </p>
          )}
        </div>
      ) : (
        <div className="identity-create">
          <div className="form-header">
            <h3>Registro de Identidad Digital</h3>
            <button
              onClick={() => setShowRegisterForm(false)}
              className="btn-link"
            >
              ← Cancelar
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="wallet">Wallet (Dirección)</label>
            <input
              id="wallet"
              type="text"
              value={address || ''}
              disabled
              className="input input-disabled"
            />
            <small className="help-text">Esta es tu dirección de wallet conectada</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dni">DNI *</label>
              <input
                id="dni"
                type="text"
                placeholder="Número de DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="input"
                maxLength={20}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="fecha-nacimiento">Fecha de Nacimiento *</label>
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
              <label htmlFor="nombre">Nombre *</label>
              <input
                id="nombre"
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Apellido *</label>
              <input
                id="apellido"
                type="text"
                placeholder="Apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="direccion">Dirección *</label>
            <input
              id="direccion"
              type="text"
              placeholder="Dirección completa"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pais">País *</label>
              <input
                id="pais"
                type="text"
                placeholder="País"
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ciudad">Ciudad *</label>
              <input
                id="ciudad"
                type="text"
                placeholder="Ciudad"
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
                placeholder="email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono *</label>
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
            <label htmlFor="dni-front">DNI - Frente *</label>
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
                <img src={frontPreview} alt="DNI Frente" />
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
            <label htmlFor="dni-back">DNI - Dorso *</label>
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
                <img src={backPreview} alt="DNI Dorso" />
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
              {uploading ? 'Subiendo datos a IPFS...' : loading ? 'Creando identidad...' : 'Crear Identidad'}
            </button>
          </div>

          <p className="help-text">
            💡 Todos tus datos sensibles se almacenarán en IPFS de forma segura.
            Solo se guardará un hash (CID) en la blockchain para reducir costos de almacenamiento.
            Tu wallet se vinculará de forma única con tu DNI.
          </p>
        </div>
      )}
    </LoanetSection>
  );
}
