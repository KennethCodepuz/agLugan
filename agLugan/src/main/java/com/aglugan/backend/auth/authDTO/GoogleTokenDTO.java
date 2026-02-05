package com.aglugan.backend.auth.authDTO;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public class GoogleTokenDTO {

    @Valid
    @NotNull
    private String idToken;

    public GoogleTokenDTO(){}
    public GoogleTokenDTO(String idToken) {
        this.idToken = idToken;
    }

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }
}
