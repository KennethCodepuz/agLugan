package com.aglugan.backend.auth;

import com.aglugan.backend.auth.authDTO.ResultDTO;
import org.springframework.stereotype.Service;
import com.aglugan.backend.auth.googleAuth.GoogleTokenVerifier;

@Service
public class AuthService {

    private final GoogleTokenVerifier verifier;

    public AuthService(GoogleTokenVerifier verifier) {
        this.verifier = verifier;
    }

    public ResultDTO registerUserLogic(String token) {
        ResultDTO user = verifier.verifyGoogleToken(token);

        return user;
    }

}
