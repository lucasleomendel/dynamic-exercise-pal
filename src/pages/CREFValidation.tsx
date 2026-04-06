import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Adjust path as necessary
import MaskedInput from 'react-text-mask'; // Assuming you're using a library for masked input

const CREFValidation = () => {
    const [cref, setCref] = useState('');
    const [status, setStatus] = useState('idle');
    const history = useHistory();

    const validateCREF = async () => {
        setStatus('pending');
        const { data, error } = await supabase.functions.invoke('validate-cref', {
            body: { cref }
        });

        if (error) {
            setStatus('invalid');
            return;
        }

        if (data.valid) {
            setStatus('valid');
            history.push('/personal');
        } else {
            setStatus('invalid');
        }
    };

    return (
        <div>
            <h1>CREF Validation</h1>
            <MaskedInput
                mask={[/\d/, /\d/, /\d/, /\d/, /\d/, /\d/, '-', 'G', '/', 'U', 'F']}
                placeholder="000000-G/UF"
                value={cref}
                onChange={(e) => setCref(e.target.value)}
            />
            <button onClick={validateCREF} disabled={status === 'pending'}>
                Validate CREF
            </button>
            {status === 'pending' && <p>Validating...</p>}
            {status === 'valid' && <p>CREF is valid!</p>}
            {status === 'invalid' && <p>CREF is invalid. Please try again.</p>}
            <a href="https://www.cref.com.br/" target="_blank" rel="noopener noreferrer">
                Official CREF Consultation
            </a>
        </div>
    );
};

export default CREFValidation;