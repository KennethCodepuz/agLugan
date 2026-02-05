package com.aglugan.backend.auth.authDTO;

public class ResultDTO {

    private GoogleUserDTO user;
    private String errorMessage;

    public ResultDTO() {}
    public ResultDTO(GoogleUserDTO user, String errorMessage) {
        this.user = user;
        this.errorMessage = errorMessage;
    }

    public GoogleUserDTO getUser() { return user; }
    public String getErrorMessage() { return errorMessage; }

    public void setUser(GoogleUserDTO user) {
        this.user = user;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public boolean isSuccess() {
        return user != null;
    }
}
